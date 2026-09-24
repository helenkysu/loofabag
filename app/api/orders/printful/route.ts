import { NextRequest, NextResponse, after } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const stripeKey = process.env.STRIPE_LIVE_MODE === 'true'
  ? process.env.STRIPE_SECRET_KEY_PROD!
  : process.env.STRIPE_SECRET_KEY!;
const stripe = new Stripe(stripeKey);

// Our product ID → Printful catalog product ID
const PRINTFUL_PRODUCT_MAP: Record<string, number> = {
  'eco-tote': 367,
  'large-eco-tote': 378,
  'premium-large-tote': 274,
};

// availability_status is an array of {region, status} objects from Printful's API.
// A variant is considered available if any region shows 'in_stock'.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isVariantInStock(v: any): boolean {
  const statuses: { region: string; status: string }[] = Array.isArray(v.availability_status)
    ? v.availability_status
    : [];
  if (statuses.length === 0) return true; // no data → assume available
  return statuses.some((s) => s.status === 'in_stock');
}

// Upload pocket1design.jpg from public/ to Supabase and return a fresh signed URL.
// This ensures Printful always gets the current file regardless of deployment state.
// Calls the Printful Mockup Generator API, downloads the result, and stores it in Supabase.
// Runs in parallel with order creation; accepts up to ~14 s for Printful to render.
async function generateAndStoreMockup(
  printfulProductId: number,
  variantId: number,
  printFileUrl: string,
  supabase: ReturnType<typeof createAdminClient>,
  sessionId: string,
): Promise<string | null> {
  try {
    // Start the mockup task
    const taskRes = await fetch(
      `https://api.printful.com/mockup-generator/create-task/${printfulProductId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variant_ids: [variantId],
          files: [{ placement: 'front', image_url: printFileUrl }],
          format: 'jpg',
        }),
      },
    );
    const taskData = await taskRes.json();
    if (taskData.code !== 200) {
      console.warn('[mockup] create-task error:', taskData.error?.message);
      return null;
    }
    const taskKey = taskData.result?.task_key;
    if (!taskKey) return null;

    // Poll until completed or 7 attempts × 2 s = 14 s max
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
    if (!mockupUrl) { console.warn('[mockup] timed out waiting for Printful mockup'); return null; }

    // Download the CDN image and re-upload to our private Supabase bucket
    const imgRes = await fetch(mockupUrl);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const storagePath = `print-files/${sessionId}/mockup-front.jpg`;
    const { error } = await supabase.storage
      .from('loofabag-private')
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.error('[mockup] supabase upload error:', error.message); return null; }

    return storagePath;
  } catch (err) {
    console.error('[mockup] error:', err);
    return null;
  }
}

async function getPocketFileUrl(supabase: ReturnType<typeof createAdminClient>): Promise<string | null> {
  try {
    const filePath = join(process.cwd(), 'public', 'pocket1design.jpg');
    const buffer = await readFile(filePath);
    const storagePath = 'pocket-design/pocket1design.jpg';
    const { error } = await supabase.storage
      .from('loofabag-private')
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });
    if (error) {
      console.error('[orders/printful] pocket upload error:', error.message);
      return null;
    }
    const { data } = await supabase.storage.from('loofabag-private').createSignedUrl(storagePath, 3600);
    return data?.signedUrl ?? null;
  } catch (err) {
    console.error('[orders/printful] pocket upload failed:', err);
    return null;
  }
}

async function getAvailableVariantId(printfulProductId: number): Promise<number | null> {
  const res = await fetch(`https://api.printful.com/products/${printfulProductId}`, {
    headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` },
  });
  const data = await res.json();
  if (data.code !== 200) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variants: any[] = data.result?.variants ?? [];
  const inStock = variants.filter(isVariantInStock);

  // Prefer light colours so the print design shows well; never fall back to black/dark
  const preferred = inStock.find((v) =>
    /oyster|natural|white|beige|cream/i.test(v.name ?? ''),
  );
  if (preferred) return preferred.id;

  // Skip black/dark variants
  const nonDark = inStock.filter((v) => !/black|dark|navy|charcoal/i.test(v.name ?? ''));
  return nonDark[0]?.id ?? inStock[0]?.id ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      stripeSessionId, productId, variantId: explicitVariantId, customerName, address,
      printFileUrl: incomingPrintFileUrl, storagePath,
      frontPreviewPath, backPreviewPath, backDesign,
      slug, productName, productImage, checkoutDraft,
    } = await req.json() as {
      stripeSessionId: string;
      productId: string;
      variantId?: number;
      customerName: string;
      address: { country: string; state: string; address1: string; address2: string; city: string; zip: string };
      printFileUrl?: string;
      storagePath?: string;
      frontPreviewPath?: string;
      backPreviewPath?: string;
      backDesign?: string;
      slug: string;
      productName: string;
      productImage?: string;
      checkoutDraft?: object;
    };

    // Verify Stripe payment before placing order
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }

    const printfulProductId = PRINTFUL_PRODUCT_MAP[productId];
    if (!printfulProductId) {
      return NextResponse.json({ error: 'Unknown product' }, { status: 400 });
    }

    if (!incomingPrintFileUrl && !storagePath) {
      return NextResponse.json({ error: 'Missing print file' }, { status: 400 });
    }

    // Resolve the URL to give Printful — either the uploaded URL or a fresh signed URL from storage
    const supabaseAdmin = createAdminClient();
    let printFileUrl = incomingPrintFileUrl ?? '';
    const resolvedStoragePath = storagePath;
    if (!printFileUrl && resolvedStoragePath) {
      const { data } = await supabaseAdmin.storage
        .from('loofabag-private')
        .createSignedUrl(resolvedStoragePath, 3600);
      if (!data?.signedUrl) {
        return NextResponse.json({ error: 'Failed to create signed URL for stored print file' }, { status: 500 });
      }
      printFileUrl = data.signedUrl;
    }

    const [variantId, pocketFileUrl] = await Promise.all([
      explicitVariantId ?? getAvailableVariantId(printfulProductId),
      getPocketFileUrl(supabaseAdmin),
    ]);
    if (!variantId) {
      return NextResponse.json({ error: 'No available variant found for this product' }, { status: 400 });
    }
    if (!pocketFileUrl) {
      console.warn('[orders/printful] Could not upload pocket file — proceeding without pocket');
    }

    const recipient: Record<string, string> = {
      name: customerName || 'Customer',
      address1: address.address1,
      city: address.city,
      country_code: address.country,
      zip: address.zip,
    };
    if (address.address2) recipient.address2 = address.address2;
    if (address.state) recipient.state_code = address.state;

    const orderRes = await fetch('https://api.printful.com/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        confirm: process.env.PRINTFUL_CONFIRM_ORDERS === 'true',
        recipient,
        items: [{
          variant_id: variantId,
          quantity: 1,
          files: [
            { type: 'default', url: printFileUrl },
            ...(pocketFileUrl ? [{ type: 'pocket', url: pocketFileUrl }] : []),
          ],
        }],
      }),
    });

    const data = await orderRes.json();

    if (data.code !== 200) {
      console.error('[orders/printful] Printful error:', data);
      return NextResponse.json(
        { error: data.error?.message ?? 'Order creation failed' },
        { status: 400 },
      );
    }

    let order = data.result;

    // Explicitly confirm if still draft — belt-and-suspenders in case the confirm flag is ignored
    if (process.env.PRINTFUL_CONFIRM_ORDERS === 'true' && order.status === 'draft') {
      try {
        const confirmRes = await fetch(`https://api.printful.com/orders/${order.id}/confirm`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` },
        });
        const confirmData = await confirmRes.json();
        if (confirmData.code === 200) {
          order = confirmData.result;
        } else {
          console.warn('[orders/printful] confirm call failed:', confirmData.error?.message);
        }
      } catch (err) {
        console.warn('[orders/printful] confirm call error:', err);
      }
    }

    const resolvedFrontPreviewPath = frontPreviewPath ?? null;
    const resolvedBackPreviewPath = backPreviewPath ?? null;

    // Generate Printful mockup after responding — don't block order confirmation
    if (!resolvedFrontPreviewPath) {
      after(async () => {
        try {
          const mockupPath = await generateAndStoreMockup(
            printfulProductId, variantId, printFileUrl, supabaseAdmin, stripeSessionId,
          );
          if (mockupPath) {
            await supabaseAdmin
              .from('loofabag_orders')
              .update({ front_preview_path: mockupPath })
              .eq('stripe_session_id', stripeSessionId);
          }
        } catch (err) {
          console.error('[after] mockup generation failed:', err);
        }
      });
    }

    const baseRow = {
      user_id: user.id,
      slug,
      product_id: productId,
      product_name: productName,
      product_image: productImage ?? null,
      variant_id: variantId,
      stripe_session_id: stripeSessionId,
      amount_total: session.amount_total,
      currency: session.currency,
      shipping_label: (session.metadata?.shippingService as string | undefined) ?? null,
      address,
      printful_order_id: order.id,
      printful_order_number: `#${order.id}`,
      status: order.status,
      checkout_draft: checkoutDraft ?? null,
    };

    let { error: dbError } = await supabaseAdmin.from('loofabag_orders').upsert(
      {
        ...baseRow,
        print_file_path: resolvedStoragePath ?? null,
        front_preview_path: resolvedFrontPreviewPath,
        back_preview_path: resolvedBackPreviewPath,
        back_design: backDesign ?? null,
      },
      { onConflict: 'stripe_session_id' },
    );

    // Fallback: if new preview columns don't exist yet (migration pending), save without them
    if (dbError?.message?.includes('front_preview_path') || dbError?.message?.includes('back_preview_path') || dbError?.message?.includes('back_design')) {
      console.warn('[orders/printful] preview columns missing — saving without them');
      ({ error: dbError } = await supabaseAdmin.from('loofabag_orders').upsert(
        { ...baseRow, print_file_path: resolvedStoragePath ?? null },
        { onConflict: 'stripe_session_id' },
      ));
    }
    if (dbError?.message?.includes('print_file_path')) {
      console.warn('[orders/printful] print_file_path column missing — saving without it');
      ({ error: dbError } = await supabaseAdmin.from('loofabag_orders').upsert(
        baseRow,
        { onConflict: 'stripe_session_id' },
      ));
    }

    if (dbError) {
      console.error('[orders/printful] Failed to persist order:', dbError);
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: `#${order.id}`,
      status: order.status,
      variantIdUsed: variantId,
      explicitVariantIdReceived: explicitVariantId ?? null,
      printFilePath: resolvedStoragePath ?? null,
      frontPreviewPath: resolvedFrontPreviewPath,
      dbError: dbError ? { message: dbError.message, code: dbError.code } : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[orders/printful]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
