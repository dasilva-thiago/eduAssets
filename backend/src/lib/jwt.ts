import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '8h';

// Renomeado para evitar colisão de nome com jwt.JwtPayload da lib
export interface AppJwtPayload {
  sub: number;
  nivelAcesso: 'ADMINISTRADOR' | 'EDITOR';
}

export function signToken(payload: AppJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AppJwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof (decoded as any).sub !== 'number' ||
    ((decoded as any).nivelAcesso !== 'ADMINISTRADOR' && (decoded as any).nivelAcesso !== 'EDITOR')
  ) {
    throw new Error('Token payload inválido.');
  }

  return decoded as unknown as AppJwtPayload;
}