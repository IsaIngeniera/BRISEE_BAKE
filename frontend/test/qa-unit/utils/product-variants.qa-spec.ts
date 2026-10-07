/* eslint-disable */
/**
 * PRUEBAS UNITARIAS QA - product-variants.ts
 *
 * Verifica la lógica de agrupamiento y presentación de variantes de productos.
 */

import {
  getProductVariantGroupKey,
  requiresProductOptions,
  isDecoratedMacaron,
  getProductDisplayName,
  getProductOptionLabel,
  sortProductVariants,
  formatProductPriceRange,
} from '@/utils/product-variants';

describe('product-variants [QA]', () => {
  // ============================================================
  // getProductVariantGroupKey
  // ============================================================
  describe('getProductVariantGroupKey', () => {
    it('debe retornar la clave base para variantes de granola', () => {
      expect(getProductVariantGroupKey('Granola Almendras y Nueces 500g')).toBe(
        'granola almendras y nueces',
      );
      expect(getProductVariantGroupKey('Granola Almendras y Nueces 300g')).toBe(
        'granola almendras y nueces',
      );
      expect(getProductVariantGroupKey('Granola Almendras y Nueces 60g')).toBe(
        'granola almendras y nueces',
      );
    });

    it('debe agrupar las cajas de macarons con el mismo key', () => {
      expect(getProductVariantGroupKey('Caja de Macarons * 3')).toBe(
        'caja de macarons',
      );
      expect(getProductVariantGroupKey('Caja de Macarons * 6')).toBe(
        'caja de macarons',
      );
      expect(getProductVariantGroupKey('Caja de Macarons * 15')).toBe(
        'caja de macarons',
      );
    });

    it('debe retornar null para productos sin variantes', () => {
      expect(getProductVariantGroupKey('Galleta Chocolate')).toBeNull();
      expect(getProductVariantGroupKey('Macarons decorado')).toBeNull();
      expect(getProductVariantGroupKey('Corona de Macarons')).toBeNull();
    });

    it('debe ser insensible a mayúsculas y tildes', () => {
      expect(getProductVariantGroupKey('GRANOLA ALMENDRAS 500g')).toBe(
        'granola almendras',
      );
    });
  });

  // ============================================================
  // requiresProductOptions
  // ============================================================
  describe('requiresProductOptions', () => {
    it('debe retornar true para granolas con tamaños', () => {
      expect(requiresProductOptions('Granola Nueces 500g')).toBe(true);
    });

    it('debe retornar true para cajas de macarons', () => {
      expect(requiresProductOptions('Caja de Macarons * 6')).toBe(true);
    });

    it('debe retornar true para Macarons decorado', () => {
      expect(requiresProductOptions('Macarons decorado')).toBe(true);
    });

    it('debe retornar false para productos simples', () => {
      expect(requiresProductOptions('Galleta Chocolate')).toBe(false);
      expect(requiresProductOptions('Corona de Macarons')).toBe(false);
    });
  });

  // ============================================================
  // isDecoratedMacaron
  // ============================================================
  describe('isDecoratedMacaron', () => {
    it('debe detectar Macarons decorado correctamente', () => {
      expect(isDecoratedMacaron('Macarons decorado')).toBe(true);
      expect(isDecoratedMacaron('Macaron decorado')).toBe(true);
    });

    it('no debe detectar otros tipos de macarons', () => {
      expect(isDecoratedMacaron('Caja de Macarons * 6')).toBe(false);
      expect(isDecoratedMacaron('Corona de Macarons')).toBe(false);
      expect(isDecoratedMacaron('Macarons')).toBe(false);
    });

    it('debe ser insensible a mayúsculas y tildes', () => {
      expect(isDecoratedMacaron('MACARONS DECORADO')).toBe(true);
      expect(isDecoratedMacaron('Macárons decorádo')).toBe(true);
    });
  });

  // ============================================================
  // getProductDisplayName
  // ============================================================
  describe('getProductDisplayName', () => {
    it('debe eliminar el tamaño en gramos de granolas', () => {
      expect(getProductDisplayName('Granola Nueces 500g')).toBe(
        'Granola Nueces',
      );
      expect(getProductDisplayName('Granola Almendras 300g')).toBe(
        'Granola Almendras',
      );
    });

    it('debe eliminar el "* N" en cajas de macarons', () => {
      expect(getProductDisplayName('Caja de Macarons * 3')).toBe(
        'Caja de Macarons',
      );
      expect(getProductDisplayName('Caja de Macarons * 15')).toBe(
        'Caja de Macarons',
      );
    });

    it('debe retornar el nombre tal cual para productos simples', () => {
      expect(getProductDisplayName('Galleta Chocolate')).toBe(
        'Galleta Chocolate',
      );
    });

    it('debe hacer trim de espacios', () => {
      expect(getProductDisplayName('  Granola Nueces 500g  ')).toBe(
        'Granola Nueces',
      );
    });
  });

  // ============================================================
  // getProductOptionLabel
  // ============================================================
  describe('getProductOptionLabel', () => {
    it('debe retornar la presentación para granolas', () => {
      const product = { nombre: 'Granola Nueces 500g', presentacion: '500g' };
      expect(getProductOptionLabel(product)).toBe('500g');
    });

    it('debe retornar "Caja xN" para cajas de macarons', () => {
      expect(
        getProductOptionLabel({
          nombre: 'Caja de Macarons * 6',
          presentacion: 'Caja 6 uni',
        }),
      ).toBe('Caja x6');
      expect(
        getProductOptionLabel({
          nombre: 'Caja de Macarons * 15',
          presentacion: 'Caja 15 uni',
        }),
      ).toBe('Caja x15');
    });

    it('debe retornar la presentación cuando no coincide con un patrón', () => {
      expect(
        getProductOptionLabel({
          nombre: 'Galleta Chocolate',
          presentacion: '70g',
        }),
      ).toBe('70g');
    });
  });

  // ============================================================
  // sortProductVariants
  // ============================================================
  describe('sortProductVariants', () => {
    it('debe ordenar variantes de granola por tamaño ascendente', () => {
      const variants = [
        { nombre: 'Granola Nueces 500g', presentacion: '500g' },
        { nombre: 'Granola Nueces 60g', presentacion: '60g' },
        { nombre: 'Granola Nueces 300g', presentacion: '300g' },
      ];
      const sorted = sortProductVariants(variants);
      expect(sorted[0].presentacion).toBe('60g');
      expect(sorted[1].presentacion).toBe('300g');
      expect(sorted[2].presentacion).toBe('500g');
    });

    it('no debe mutar el array original', () => {
      const variants = [
        { nombre: 'Granola Nueces 500g', presentacion: '500g' },
        { nombre: 'Granola Nueces 60g', presentacion: '60g' },
      ];
      const original = [...variants];
      sortProductVariants(variants);
      expect(variants).toEqual(original);
    });

    it('debe retornar array vacío si no hay variantes', () => {
      expect(sortProductVariants([])).toEqual([]);
    });
  });

  // ============================================================
  // formatProductPriceRange
  // ============================================================
  describe('formatProductPriceRange', () => {
    it('debe retornar "COP $ 0" si no hay precios', () => {
      expect(formatProductPriceRange([])).toBe('COP $ 0');
    });

    it('debe retornar un solo precio si todos son iguales', () => {
      const products = [{ precio: 10000 }, { precio: 10000 }];
      expect(formatProductPriceRange(products)).toBe('COP $ 10.000');
    });

    it('debe retornar un rango si hay diferentes precios', () => {
      const products = [
        { precio: 10000 },
        { precio: 25000 },
        { precio: 50000 },
      ];
      const result = formatProductPriceRange(products);
      expect(result).toContain('10.000');
      expect(result).toContain('50.000');
      expect(result).toContain('Desde');
      expect(result).toContain('hasta');
    });

    it('debe filtrar precios no finitos (NaN, Infinity)', () => {
      const products = [
        { precio: 10000 },
        { precio: 'invalid' },
        { precio: 20000 },
      ];
      const result = formatProductPriceRange(products);
      expect(result).toContain('10.000');
      expect(result).toContain('20.000');
    });

    it('debe convertir precios en formato string a número', () => {
      const products = [{ precio: '15000' }, { precio: '35000' }];
      const result = formatProductPriceRange(products);
      expect(result).toContain('15.000');
      expect(result).toContain('35.000');
    });

    it('debe formatear con separadores de miles en formato COP', () => {
      const products = [{ precio: 1000000 }];
      const result = formatProductPriceRange(products);
      expect(result).toContain('1.000.000');
    });
  });
});
