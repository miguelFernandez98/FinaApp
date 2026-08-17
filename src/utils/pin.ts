/**
 * Genera un hash determinístico del PIN (cyrb53) para no almacenar
 * el PIN en texto plano. No es criptografía fuerte, pero evita
 * persistir el PIN directamente en localStorage.
 * @param pin PIN a hashear.
 * @returns Hash hexadecimal de 16 caracteres.
 */
export function hashPin(pin: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < pin.length; i++) {
    const ch = pin.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h1 >>> 0).toString(16).padStart(8, "0")
  );
}