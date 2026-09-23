import { NextRequest, NextResponse, after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const PRODUCT_TO_PRINTFUL_ID: Record<string, number> = {
  'eco-tote': 367,
  'large-eco-tote': 378,
  'premium-large-tote': 274,
};

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

        // For orders with no preview yet, generate a real product mockup via Printful
        // Mockup Generator API after responding (files[0].preview_url is a print file
        // thumbnail, not a product photo — so we skip it and use the mockup generator).
        if (!o.front_preview_path && o.print_file_path && o.variant_id) {
          const pfProductId = PRODUCT_TO_PRINTFUL_ID[o.product_id];
          if (pfProductId) {
            const orderId = o.id;
            const printFilePath: string = o.print_file_path;
            const variantId: number = o.variant_id;
            after(async () => {
              try {
                // Fresh signed URL so Printful can fetch the print file
                const { data: urlData } = await admin.storage
                  .from('loofabag-private')
                  .createSignedUrl(printFilePath, 3600);
                if (!urlData?.signedUrl) return;

                const taskRes = await fetch(
                  `https://api.printful.com/mockup-generator/create-task/${pfProductId}`,
                  {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      variant_ids: [variantId],
                      files: [{ placement: 'default', image_url: urlData.signedUrl }],
                      format: 'jpg',
                    }),
                  },
                );
                const taskData = await taskRes.json();
                if (taskData.code !== 200) return;
                const taskKey = taskData.result?.task_key;
                if (!taskKey) return;

                let mockupUrl: string | null = null;
                for (let i = 0; i < 7; i++) {
                  await new Promise((r) => setTimeout(r, 2000));
                  const pollRes = await fetch(
                    `https://api.printful.com/mockup-generator/task?task_key=${taskKey}`,
                    { headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` } },
                  );
                  const pollData = await pollRes.json();
                  if (pollData.result?.status === 'completed') {
                    mockupUrl = pollData.result?.mockups?.[0]?.mockup_url ?? null;
                    break;
                  }
                }
                if (!mockupUrl) return;

                const imgBuf = Buffer.from(await (await fetch(mockupUrl)).arrayBuffer());
                const storagePath = `print-files/mockup-${orderId}/mockup-front.jpg`;
                const { error } = await admin.storage
                  .from('loofabag-private')
                  .upload(storagePath, imgBuf, { contentType: 'image/jpeg', upsert: true });
                if (!error) {
                  await admin
                    .from('loofabag_orders')
                    .update({ front_preview_path: storagePath })
                    .eq('id', orderId);
                }
              } catch (e) {
                console.error('[orders] mockup gen failed:', e);
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
      if (frontPreviewSignedUrl) extras.frontPreviewSignedUrl = frontPreviewSignedUrl;
      if (backPreviewSignedUrl) extras.backPreviewSignedUrl = backPreviewSignedUrl;

      return { ...base, ...extras };
    }));

    return NextResponse.json({ orders: clientOrders });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
