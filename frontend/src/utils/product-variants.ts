import { normalizeText } from './normalize-text';

export interface ProductVariant {
  id: string | number;
  nombre: string;
  precio: number | string;
  presentacion: string;
  existencias: number;
  imagenUrl: string;
}

function normalizedName(name: string): string {
  return normalizeText(name).replace(/\s+/g, ' ').trim();
}

export function getProductVariantGroupKey(name: string): string | null {
  const normalized = normalizedName(name);

  if (normalized.includes('granola')) {
    return normalized.replace(/\s+\d+\s*g$/, '');
  }

  if (/^caja de macarons\s*\*\s*\d+$/.test(normalized)) {
    return 'caja de macarons';
  }

  return null;
}

export function requiresProductOptions(name: string): boolean {
  return (
    getProductVariantGroupKey(name) !== null ||
    isDecoratedMacaron(name)
  );
}

export function isDecoratedMacaron(name: string): boolean {
  return /^macarons?\s+decorado$/.test(normalizedName(name));
}

export function getProductDisplayName(name: string): string {
  const trimmedName = name.trim();

  if (normalizedName(trimmedName).includes('granola')) {
    return trimmedName.replace(/\s+\d+\s*g$/i, '');
  }

  return trimmedName.replace(/\s*\*\s*\d+$/, '');
}

export function getProductOptionLabel(
  product: Pick<ProductVariant, 'nombre' | 'presentacion'>,
): string {
  const normalized = normalizedName(product.nombre);

  if (normalized.includes('granola')) {
    return product.presentacion || normalized.match(/\d+\s*g$/)?.[0] || '';
  }

  const count = normalized.match(/\*\s*(\d+)$/)?.[1];
  return count ? `Caja x${count}` : product.presentacion;
}

export function sortProductVariants<T extends Pick<ProductVariant, 'nombre' | 'presentacion'>>(
  products: T[],
): T[] {
  return [...products].sort((a, b) => {
    const aValue = Number(getProductOptionLabel(a).match(/\d+/)?.[0] ?? 0);
    const bValue = Number(getProductOptionLabel(b).match(/\d+/)?.[0] ?? 0);
    return aValue - bValue;
  });
}

export function formatProductPriceRange(
  products: Array<Pick<ProductVariant, 'precio'>>,
): string {
  const prices = products
    .map((product) => Number(product.precio))
    .filter((price) => Number.isFinite(price));

  if (prices.length === 0) {
    return 'COP $ 0';
  }

  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  const formatPrice = (price: number) =>
    price.toLocaleString('es-CO', { maximumFractionDigits: 0 });

  return minimum === maximum
    ? `COP $ ${formatPrice(minimum)}`
    : `Desde COP $ ${formatPrice(minimum)} hasta COP $ ${formatPrice(maximum)}`;
}
