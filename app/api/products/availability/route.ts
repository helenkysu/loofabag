import { NextResponse } from 'next/server';

const PRINTFUL_PRODUCT_MAP: Record<string, number> = {
  'eco-tote': 367,
  'large-eco-tote': 378,
  'premium-large-tote': 274,
};

interface PrintfulVariant {
  id: number;
  name: string;
  color?: string;
  color_code?: string;
  availability_status: { region: string; status: string }[] | null;
}

function isInStock(v: PrintfulVariant): boolean {
  const s = Array.isArray(v.availability_status) ? v.availability_status : [];
  if (s.length === 0) return true;
  return s.some((r) => r.status === 'in_stock');
}

async function fetchVariants(printfulProductId: number): Promise<PrintfulVariant[]> {
  const res = await fetch(`https://api.printful.com/products/${printfulProductId}`, {
    headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}` },
    next: { revalidate: 300 }, // cache 5 min
  });
  const data = await res.json();
  if (data.code !== 200) return [];
  return data.result?.variants ?? [];
}

function preferredVariant(variants: PrintfulVariant[]): PrintfulVariant | null {
  const inStock = variants.filter(isInStock);
  return (
    inStock.find((v) => /oyster|natural|white|beige|cream/i.test(v.name)) ??
    inStock[0] ??
    null
  );
}

export async function GET() {
  const results = await Promise.all(
    Object.entries(PRINTFUL_PRODUCT_MAP).map(async ([productId, printfulId]) => {
      const variants = await fetchVariants(printfulId);
      const inStock = variants.filter(isInStock);
      const preferred = preferredVariant(variants);

      // For products with multiple meaningful variants (handle colours etc.), expose them
      const hasColorChoice = variants.length > 1 && variants.every((v) => v.color);
      const variantOptions = hasColorChoice
        ? inStock.map((v) => ({
            id: v.id,
            label: v.color ?? v.name,
            colorCode: v.color_code ?? null,
            inStock: true,
          }))
        : null;

      return [
        productId,
        {
          inStock: inStock.length > 0,
          defaultVariantId: preferred?.id ?? null,
          variants: variantOptions,
        },
      ] as const;
    }),
  );

  return NextResponse.json(Object.fromEntries(results));
}
