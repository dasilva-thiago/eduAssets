/**
 * WARNING: Temporary implementation.
 *
 * Admin inactivity tracking is stored in process memory using a Map and only
 * works correctly when the backend runs as a single instance.
 *
 * In multi-instance deployments (e.g. Render auto-scaling, AWS ECS, Kubernetes),
 * each instance maintains its own inactivity timer, making the 30-minute timeout
 * inconsistent across requests routed to different instances.
 *
 * If the backend is ever scaled horizontally, migrate this state to a shared
 * storage layer (e.g. Redis) before deploying.
 */

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