// src/common/utils/normalize.ts
export function normalizeWord(w: string) {
  return w
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-zñ]/g, ''); // deja solo letras (mantén ñ si quieres)
}

// Cuenta letras (maneja duplicadas)
export function countLetters(s: string) {
  const map = new Map<string, number>();
  for (const ch of s) map.set(ch, (map.get(ch) ?? 0) + 1);
  return map;
}
