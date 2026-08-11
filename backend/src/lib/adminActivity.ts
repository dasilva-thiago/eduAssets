const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ultimaAtividade = new Map<number, number>();

export function registrarAtividadeAdmin(usuarioId: number): void {
  ultimaAtividade.set(usuarioId, Date.now());
}

export function sessaoAdminExpirada(usuarioId: number): boolean {
  const ultima = ultimaAtividade.get(usuarioId);
  if (ultima === undefined) return false; // primeira requisição após login
  return Date.now() - ultima > IDLE_TIMEOUT_MS;
}

export function limparAtividadeAdmin(usuarioId: number): void {
  ultimaAtividade.delete(usuarioId);
}