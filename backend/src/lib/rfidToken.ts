import crypto from 'crypto';

export function gerarRfidToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashRfidToken(tokenHex: string): string {
  return crypto.createHash('sha256').update(tokenHex.toLowerCase()).digest('hex');
}