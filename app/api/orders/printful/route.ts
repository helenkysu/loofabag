import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

async function getAvailableVariantId(printfulProductId: number): Promise<number | null> {
  const res = await fetch(`https://api.printful.com/products/${printfulProductId}`, {
    headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` },
  });
  const data = await res.json();
  if (data.code !== 200) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variants: any[] = data.result?.variants ?? [];
  const inStock = variants.filter(isVariantInStock);

  // Prefer light colours (Oyster, Natural, White) so the print design shows well
  const preferred = inStock.find((v) =>
    /oyster|natural|white|beige|cream/i.test(v.name ?? ''),
  );
  return preferred?.id ?? inStock[0]?.id ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const { stripeSessionId, productId, variantId: explicitVariantId, customerName, address, printFileUrl } =
      await req.json() as {
        stripeSessionId: string;
        productId: string;
        variantId?: number;
        customerName: string;
        address: { country: string; state: string; address1: string; address2: string; city: string; zip: string };
        printFileUrl: string;
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

    if (!printFileUrl) {
      return NextResponse.json({ error: 'Missing print file URL' }, { status: 400 });
    }

    const variantId = explicitVariantId ?? await getAvailableVariantId(printfulProductId);
    if (!variantId) {
      return NextResponse.json({ error: 'No available variant found for this product' }, { status: 400 });
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

    // confirm: false → draft order (test mode, not fulfilled until confirmed)
    const res = await fetch('https://api.printful.com/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        confirm: false,
        recipient,
        items: [{
          variant_id: variantId,
          quantity: 1,
          files: [{ type: 'default', url: printFileUrl }],
        }],
      }),
    });

    const data = await res.json();

    if (data.code !== 200) {
      console.error('[orders/printful] Printful error:', data);
      return NextResponse.json(
        { error: data.error?.message ?? 'Order creation failed' },
        { status: 400 },
      );
    }

    const order = data.result;
    return NextResponse.json({
      orderId: order.id,
      orderNumber: `#${order.id}`,
      status: order.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[orders/printful]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
