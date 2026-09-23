import { NextRequest, NextResponse, after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface Tracking {
  trackingNumber: string;
  trackingUrl: string | null;
  carrier: string | null;
  service: string | null;
  shipDate: string | null;
  estimatedDelivery: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToClient(o: any) {
  return {
    id: o.id as string,
    slug: o.slug as string,
    productId: o.product_id as string,
    productName: o.product_name as string,
    productImage: (o.product_image ?? null) as string | null,
    amountTotal: (o.amount_total ?? null) as number | null,
    currency: (o.currency ?? null) as string | null,
    shippingLabel: (o.shipping_label ?? null) as string | null,
    address: (o.address ?? {}) as Record<string, string>,
    printfulOrderNumber: (o.printful_order_number ?? null) as string | null,
    status: o.status as string,
    tracking: (o.tracking ?? null) as Tracking | null,
    checkoutDraft: (o.checkout_draft ?? null) as object | null,
    printFilePath: (o.print_file_path ?? null) as string | null,
    frontPreviewPath: (o.front_preview_path ?? null) as string | null,
    backPreviewPath: (o.back_preview_path ?? null) as string | null,
    backDesign: (o.back_design ?? null) as string | null,
    createdAt: o.created_at as string,
  };
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const slug = req.nextUrl.searchParams.get('slug');

    const admin = createAdminClient();
    let query = admin
      .from('loofabag_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (slug) query = query.eq('slug', slug);

    const { data: orders, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!orders?.length) return NextResponse.json({ orders: [] });

    // Refresh live status/tracking from Printful for orders that have a Printful order id
    await Promise.all(orders.map(async (o) => {
      if (!o.printful_order_id) return;
      try {
        const res = await fetch(`https://api.printful.com/orders/${o.printful_order_id}`, {
          headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` },
        });
        const data = await res.json();
        if (data.code !== 200) return;

        const result = data.result;
        const shipment = result.shipments?.[0];
        const tracking: Tracking | null = shipment ? {
          trackingNumber: shipment.tracking_number,
          trackingUrl: shipment.tracking_url ?? null,
          carrier: shipment.carrier ?? null,
          service: shipment.service ?? null,
          shipDate: shipment.ship_date ?? null,
          estimatedDelivery: shipment.estimated_delivery ?? null,
        } : null;

        const statusChanged = result.status !== o.status;
        const trackingChanged = JSON.stringify(tracking) !== JSON.stringify(o.tracking ?? null);
        if (statusChanged || trackingChanged) {
          o.status = result.status;
          o.tracking = tracking;
          await admin
            .from('loofabag_orders')
            .update({ status: result.status, tracking, updated_at: new Date().toISOString() })
            .eq('id', o.id);
        }

        // If we have no stored preview, extract Printful's generated mockup URL
        if (!o.front_preview_path) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const files: any[] = result.items?.[0]?.files ?? [];
          const defaultFile = files.find((f: { type: string }) => f.type === 'default');
          const printfulPreviewUrl: string | null = defaultFile?.preview_url ?? null;
          if (printfulPreviewUrl) {
            // Use the Printful CDN URL immediately for this response
            o.printful_preview_url = printfulPreviewUrl;
            // Download + store to Supabase after responding so future loads use our DB
            const orderId = o.id;
            const printfulOrderId = o.printful_order_id;
            after(async () => {
              try {
                const imgRes = await fetch(printfulPreviewUrl);
                const buffer = Buffer.from(await imgRes.arrayBuffer());
                const storagePath = `print-files/printful-${printfulOrderId}/mockup-front.jpg`;
                const { error } = await admin.storage
                  .from('loofabag-private')
                  .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });
                if (!error) {
                  await admin
                    .from('loofabag_orders')
                    .update({ front_preview_path: storagePath })
                    .eq('id', orderId);
                }
              } catch (e) {
                console.error('[orders] mockup cache failed:', e);
              }
            });
          }
        }
      } catch (err) {
        console.error('[orders] Failed to refresh from Printful:', err);
      }
    }));

    // Generate short-lived signed URLs for stored files
    const clientOrders = await Promise.all(orders.map(async (o) => {
      const base = dbToClient(o);
      const extras: Record<string, string | null> = {};

      const signPath = async (path: string | null): Promise<string | null> => {
        if (!path) return null;
        try {
          const { data } = await admin.storage.from('loofabag-private').createSignedUrl(path, 3600);
          return data?.signedUrl ?? null;
        } catch {
          return null;
        }
      };

      const [printFileSignedUrl, frontPreviewSignedUrl, backPreviewSignedUrl] = await Promise.all([
        signPath(o.print_file_path),
        signPath(o.front_preview_path),
        signPath(o.back_preview_path),
      ]);

      if (printFileSignedUrl) extras.printFileSignedUrl = printFileSignedUrl;
      // Fall back to Printful CDN URL when no stored preview exists yet
      if (frontPreviewSignedUrl) extras.frontPreviewSignedUrl = frontPreviewSignedUrl;
      else if (o.printful_preview_url) extras.frontPreviewSignedUrl = o.printful_preview_url;
      if (backPreviewSignedUrl) extras.backPreviewSignedUrl = backPreviewSignedUrl;

      return { ...base, ...extras };
    }));

    return NextResponse.json({ orders: clientOrders });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
