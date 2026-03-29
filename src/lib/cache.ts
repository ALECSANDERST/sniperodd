// Cache em memória server-side
// Os dados ficam em RAM do servidor — perfeito para Vercel (serverless tem ~10min de warm)
// TTL padrão: 30 minutos para jogos, 10 minutos para odds de um jogo específico

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const TTL = {
  GAMES_LIST: 30 * 60 * 1000,    // 30 min — lista de jogos muda pouco
  GAME_ODDS: 10 * 60 * 1000,     // 10 min — odds mudam mais
};

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(keyPrefix)) store.delete(key);
  }
}

export { TTL };
