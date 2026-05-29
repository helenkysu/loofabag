import { NextRequest, NextResponse } from 'next/server';

// Our product ID → Printful catalog product ID
const PRINTFUL_PRODUCT_MAP: Record<string, number> = {
  'eco-tote': 367,
  'large-eco-tote': 378,
  'premium-large-tote': 274,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isVariantInStock(v: any): boolean {
  const statuses: { region: string; status: string }[] = Array.isArray(v.availability_status)
    ? v.availability_status
    : [];
  if (statuses.length === 0) return true;
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

  const preferred = inStock.find((v) =>
    /oyster|natural|white|beige|cream/i.test(v.name ?? ''),
  );
  return preferred?.id ?? inStock[0]?.id ?? null;
}

export async function POST(req: NextRequest) {
  const { productId, variantId: explicitVariantId, country, state, address1, address2, city, zip } = await req.json() as {
    productId: string;
    variantId?: number;
    country: string;
    state?: string;
    address1?: string;
    address2?: string;
    city?: string;
    zip?: string;
  };

  const printfulProductId = PRINTFUL_PRODUCT_MAP[productId];
  if (!printfulProductId) {
    return NextResponse.json({ error: 'Unknown product' }, { status: 400 });
  }
  if (!country) {
    return NextResponse.json({ error: 'Country is required' }, { status: 400 });
  }

  const variantId = explicitVariantId ?? await getAvailableVariantId(printfulProductId);
  if (!variantId) {
    return NextResponse.json({ error: 'No available variant found for this product' }, { status: 400 });
  }

  const recipient: Record<string, string> = { country_code: country };
  if (state) recipient.state_code = state;
  if (address1) recipient.address1 = address1;
  if (address2) recipient.address2 = address2;
  if (city) recipient.city = city;
  if (zip) recipient.zip = zip;

  const res = await fetch('https://api.printful.com/shipping/rates', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient,
      items: [{ variant_id: variantId, quantity: 1 }],
      currency: 'USD',
    }),
  });

  const data = await res.json();

  if (data.code !== 200 || !data.result?.length) {
    return NextResponse.json(
      { error: data.error?.message ?? 'Failed to fetch shipping rates' },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rates = data.result.map((r: any) => ({
    id: r.id,
    name: r.name,
    rate: r.rate,
    currency: r.currency,
    minDeliveryDays: r.minDeliveryDays,
    maxDeliveryDays: r.maxDeliveryDays,
  }));

  return NextResponse.json({ rates });
}
