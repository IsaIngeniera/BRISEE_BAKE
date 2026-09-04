/**
 * Normaliza texto para comparaciones de búsqueda:
 * ignora tildes, mayúsculas/minúsculas y espacios extremos.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}