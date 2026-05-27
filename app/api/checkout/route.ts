import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRODUCT_MAP: Record<string, string> = {
  'eco-tote': 'prod_UafgTxRmQLMdbg',
  'large-eco-tote': 'prod_UafhIaLEJSyn7L',
  'premium-large-tote': 'prod_UafjK3Rqo6GSO6',
};

export async function POST(req: NextRequest) {
  try {
    const { productId, slug, shippingLabel, shippingAmount, address } =
      await req.json() as {
        productId: string;
        slug: string;
        shippingLabel: string;
        shippingAmount: number; // in cents
        address: { country: string; state: string; address1: string; address2: string; city: string; zip: string };
      };

    const stripeProductId = PRODUCT_MAP[productId];
    if (!stripeProductId) {
      return NextResponse.json({ error: 'Unknown product' }, { status: 400 });
    }

    const prices = await stripe.prices.list({ product: stripeProductId, active: true, limit: 1 });
    const price = prices.data[0];
    if (!price) {
      return NextResponse.json({ error: `No active price found for product ${stripeProductId}` }, { status: 400 });
    }

    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_BASE_URL ?? '';
    const currency = price.currency.toLowerCase();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        { price: price.id, quantity: 1 },
        {
          price_data: {
            currency,
            product_data: { name: `Shipping — ${shippingLabel}` },
            unit_amount: shippingAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/my-loofas/create?resume=4&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/my-loofas/create?resume=3`,
      metadata: {
        slug,
        productId,
        shippingService: shippingLabel,
        ship_address1: address.address1,
        ship_address2: address.address2 ?? '',
        ship_city: address.city,
        ship_state: address.state ?? '',
        ship_zip: address.zip,
        ship_country: address.country,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[checkout] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
