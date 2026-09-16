import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRODUCT_MAP: Record<string, string> = {
  'eco-tote': 'prod_UafgTxRmQLMdbg',
  'large-eco-tote': 'prod_UafhIaLEJSyn7L',
  'premium-large-tote': 'prod_UafjK3Rqo6GSO6',
};

export async function GET() {
  try {
    const entries = await Promise.all(
      Object.entries(PRODUCT_MAP).map(async ([productId, stripeId]) => {
        const prices = await stripe.prices.list({ product: stripeId, active: true, limit: 1 });
        const price = prices.data[0];
        return [
          productId,
          price
            ? { amount: price.unit_amount ?? 0, currency: price.currency.toUpperCase() }
            : null,
        ] as const;
      }),
    );
    return NextResponse.json(Object.fromEntries(entries));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
