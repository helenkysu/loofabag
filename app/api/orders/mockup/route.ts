import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Mockup polling can take up to 20 s — raise the Vercel function limit
export const maxDuration = 60;

const PRODUCT_TO_PRINTFUL_ID: Record<string, number> = {
  'eco-tote': 367,
  'large-eco-tote': 378,
  'premium-large-tote': 274,
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId } = await req.json() as { orderId: string };
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const admin = createAdminClient();

    // Load the order — verify it belongs to this user
    const { data: order } = await admin
      .from('loofabag_orders')
      .select('id, product_id, variant_id, printful_order_id, front_preview_path, print_file_path')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.front_preview_path) {
      // Already exists — return the signed URL
      const { data } = await admin.storage
        .from('loofabag-private')
        .createSignedUrl(order.front_preview_path, 3600);
      return NextResponse.json({ signedUrl: data?.signedUrl ?? null });
    }

    const pfProductId = PRODUCT_TO_PRINTFUL_ID[order.product_id];
    if (!pfProductId || !order.variant_id || !order.printful_order_id) {
      return NextResponse.json({ error: 'Cannot generate mockup for this order' }, { status: 422 });
    }

    // Resolve a publicly accessible URL for the print file.
    // Option 1: fresh signed URL from our Supabase storage (full resolution, preferred)
    // Option 2: Printful's own preview_url from the order (fallback for old orders)
    let printFileImageUrl: string | null = null;

    if (order.print_file_path) {
      const { data: urlData } = await admin.storage
        .from('loofabag-private')
        .createSignedUrl(order.print_file_path, 3600);
      if (urlData?.signedUrl) printFileImageUrl = urlData.signedUrl;
    }

    if (!printFileImageUrl) {
      // Fetch the Printful order to grab the print file preview URL
      const pfRes = await fetch(`https://api.printful.com/orders/${order.printful_order_id}`, {
        headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` },
      });
      const pfData = await pfRes.json();
      if (pfData.code !== 200) return NextResponse.json({ error: 'Printful order not found' }, { status: 404 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const files: any[] = pfData.result?.items?.[0]?.files ?? [];
      const defaultFile = files.find((f: { type: string }) => f.type === 'default');
      // preview_url is a Printful CDN URL — publicly accessible, suitable for mockup generator
      printFileImageUrl = defaultFile?.preview_url ?? null;
    }

    if (!printFileImageUrl) {
      return NextResponse.json({ error: 'No accessible print file URL found for this order' }, { status: 422 });
    }

    // Create mockup task — Printful requires a public image_url (not a file id)
    // Tote bags use placement 'front', not 'default' (which is for order file types)
    const taskRes = await fetch(
      `https://api.printful.com/mockup-generator/create-task/${pfProductId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variant_ids: [order.variant_id],
          files: [{ placement: 'front', image_url: printFileImageUrl }],
          format: 'jpg',
        }),
      },
    );
    const taskData = await taskRes.json();
    console.log('[mockup] create-task response:', JSON.stringify(taskData).slice(0, 300));
    if (taskData.code !== 200) {
      console.error('[mockup] create-task error:', taskData);
      return NextResponse.json({ error: taskData.error?.message ?? 'Mockup task failed' }, { status: 500 });
    }
    const taskKey = taskData.result?.task_key;
    if (!taskKey) return NextResponse.json({ error: 'No task key returned' }, { status: 500 });

    // Poll until complete (1 s intervals, up to 20 s)
    let mockupUrl: string | null = null;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const pollRes = await fetch(
        `https://api.printful.com/mockup-generator/task?task_key=${taskKey}`,
        { headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` } },
      );
      const pollData = await pollRes.json();
      if (pollData.result?.status === 'completed') {
        mockupUrl = pollData.result?.mockups?.[0]?.mockup_url ?? null;
        break;
      }
      if (pollData.result?.status === 'failed') {
        return NextResponse.json({ error: 'Mockup generation failed' }, { status: 500 });
      }
    }
    if (!mockupUrl) return NextResponse.json({ error: 'Mockup timed out' }, { status: 504 });

    // Download and store in Supabase
    const imgBuf = Buffer.from(await (await fetch(mockupUrl)).arrayBuffer());
    const storagePath = `print-files/mockup-${orderId}/mockup-front.jpg`;
    const { error: uploadError } = await admin.storage
      .from('loofabag-private')
      .upload(storagePath, imgBuf, { contentType: 'image/jpeg', upsert: true });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    await admin.from('loofabag_orders').update({ front_preview_path: storagePath }).eq('id', orderId);

    const { data: urlData } = await admin.storage
      .from('loofabag-private')
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({ signedUrl: urlData?.signedUrl ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[orders/mockup]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
