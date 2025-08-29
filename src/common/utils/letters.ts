// src/common/utils/letters.ts
const ALPHABET = 'abcdefghijklmnñopqrstuvwxyz';
export function randomLetters3() {
  let out = '';
  for (let i = 0; i < 3; i++)
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out.toUpperCase(); // p.ej. "RRN" (duplicadas permitidas)
}
