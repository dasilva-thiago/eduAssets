import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../src/errors/AppError.js';
import { agruparQuantidades, EstoqueInsuficienteError } from '../src/services/estoque.service.js';
import { safeCompareSecrets, gerarRfidToken, hashRfidToken } from '../src/lib/rfidToken.js';
import { signToken, verifyToken } from '../src/lib/jwt.js';

describe('AppError', () => {
  it('instantiates correctly with status, chaveI18n and optional extra payload', () => {
    const error = new AppError(404, 'backend.geral.registro_nao_encontrado', { id: 123 });
    assert.equal(error.status, 404);
    assert.equal(error.chaveI18n, 'backend.geral.registro_nao_encontrado');
    assert.deepEqual(error.extra, { id: 123 });
    assert.equal(error.message, 'backend.geral.registro_nao_encontrado');
  });

  it('EstoqueInsuficienteError extends AppError with 400 status and item payload', () => {
    const items = [
      { equipamentoId: 1, nome: 'Notebook', categoria: 'TI', solicitado: 5, disponivel: 2 },
    ];
    const error = new EstoqueInsuficienteError(items);
    assert.equal(error.status, 400);
    assert.equal(error.chaveI18n, 'Estoque insuficiente para 1 equipamento(s).');
    assert.deepEqual(error.itens, items);
    assert.deepEqual(error.extra, { itens: items });
  });
});

describe('Estoque Service', () => {
  it('groups multiple quantities by equipment ID correctly', () => {
    const items = [
      { equipamentoId: 1, quantidade: 2 },
      { equipamentoId: 2, quantidade: 1 },
      { equipamentoId: 1, quantidade: 3 },
    ];
    const grouped = agruparQuantidades(items);
    assert.equal(grouped.size, 2);
    assert.equal(grouped.get(1), 5);
    assert.equal(grouped.get(2), 1);
  });
});

describe('Constant-Time Secret Comparison', () => {
  it('returns true for matching secrets', () => {
    const secret = 'super-secret-random-bridge-token-value-12345';
    assert.equal(safeCompareSecrets(secret, secret), true);
  });

  it('returns false for mismatched secrets of equal length', () => {
    assert.equal(safeCompareSecrets('secret123456789012345678901234', 'secret123456789012345678901235'), false);
  });

  it('returns false safely without throwing on unequal buffer lengths', () => {
    assert.equal(safeCompareSecrets('short', 'much-longer-secret-value-here'), false);
    assert.equal(safeCompareSecrets('', 'secret'), false);
    assert.equal(safeCompareSecrets(undefined, 'secret'), false);
  });
});

describe('RFID Tokens', () => {
  it('generates 32-character hex tokens and hashes them deterministically', () => {
    const token = gerarRfidToken();
    assert.match(token, /^[0-9a-f]{32}$/);
    const hash1 = hashRfidToken(token);
    const hash2 = hashRfidToken(token.toUpperCase());
    assert.equal(hash1, hash2);
    assert.equal(hash1.length, 64);
  });
});

describe('JWT Service', () => {
  it('signs and verifies tokens using HS256 algorithm', () => {
    const payload = { sub: 42, nivelAcesso: 'ADMINISTRADOR' as const };
    const token = signToken(payload);
    assert.equal(typeof token, 'string');
    const decoded = verifyToken(token);
    assert.equal(decoded.sub, 42);
    assert.equal(decoded.nivelAcesso, 'ADMINISTRADOR');
  });

  it('rejects invalid or tampered tokens', () => {
    assert.throws(() => verifyToken('invalid.token.here'));
  });
});
