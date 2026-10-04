/**
 * PRUEBAS UNITARIAS QA - normalize-text.ts
 *
 * Verifica la normalización de texto usada para búsquedas.
 */

import { normalizeText } from '@/utils/normalize-text';

describe('normalizeText [QA]', () => {
  it('debe convertir a minúsculas', () => {
    expect(normalizeText('HOLA')).toBe('hola');
    expect(normalizeText('Mundo')).toBe('mundo');
  });

  it('debe eliminar tildes y acentos', () => {
    expect(normalizeText('áéíóú')).toBe('aeiou');
    expect(normalizeText('Niño')).toBe('nino');
    expect(normalizeText('Café')).toBe('cafe');
    expect(normalizeText('ÁRBOL')).toBe('arbol');
  });

  it('debe eliminar espacios al inicio y al final', () => {
    expect(normalizeText('  hola  ')).toBe('hola');
    expect(normalizeText('\n texto \t')).toBe('texto');
  });

  it('debe combinar minúsculas, tildes y trim', () => {
    expect(normalizeText('  ÁRBOL  ')).toBe('arbol');
    expect(normalizeText(' Niño ')).toBe('nino');
  });

  it('debe retornar string vacío si el input es vacío', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText('   ')).toBe('');
  });

  it('no debe eliminar caracteres especiales no diacríticos', () => {
    expect(normalizeText('hola!')).toBe('hola!');
    expect(normalizeText('100%')).toBe('100%');
  });

  it('debe manejar emojis sin modificarlos', () => {
    expect(normalizeText('🍪 Cookie 🍪')).toBe('🍪 cookie 🍪');
  });

  it('debe normalizar nombres de productos típicos', () => {
    expect(normalizeText('Granola Almendras y Nueces 500g')).toBe(
      'granola almendras y nueces 500g',
    );
    expect(normalizeText('Caja de Macarons * 15')).toBe(
      'caja de macarons * 15',
    );
  });

  it('debe ser útil para búsquedas insensibles a tildes', () => {
    const texto1 = normalizeText('Galleta de Chocolate');
    const texto2 = normalizeText('galletá de chócolate');
    expect(texto1).toBe(texto2);
  });
});
