import crypto from 'crypto';

export function gerarRfidToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashRfidToken(tokenHex: string): string {
  return crypto.createHash('sha256').update(tokenHex.toLowerCase()).digest('hex');
}

/**
 * Comparação em tempo constante para segredos compartilhados (ex: RFID_BRIDGE_SECRET).
 * Trata comprimentos diferentes sem vazar tempo nem lançar erro de tamanho incompatível de buffer.
 */
export function safeCompareSecrets(provided?: string, expected?: string): boolean {
  if (!provided || !expected) return false;
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}