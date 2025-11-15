// Cache simple en mémoire pour optimiser les performances
// TTL par défaut : 5 minutes (300000ms)

interface CacheEntry<T> {
  data: T
  expiry: number
}

const cache = new Map<string, CacheEntry<any>>()

/**
 * Cache une fonction asynchrone avec expiration automatique
 * @param key - Clé unique du cache
 * @param fetcher - Fonction qui récupère les données
 * @param ttl - Durée de vie du cache en millisecondes (défaut: 5 minutes)
 * @returns Les données (depuis le cache ou fraîches)
 */
export function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300000
): Promise<T> {
  const cached = cache.get(key)
  
  // Retourner depuis le cache si valide
  if (cached && cached.expiry > Date.now()) {
    console.log(`[CACHE-HIT] ${key}`)
    return Promise.resolve(cached.data)
  }

  // Sinon, récupérer les données fraîches
  console.log(`[CACHE-MISS] ${key}`)
  return fetcher().then((data) => {
    cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    })
    return data
  })
}

/**
 * Invalide une entrée spécifique du cache
 * @param key - Clé du cache à invalider
 */
export function invalidateCache(key: string): void {
  cache.delete(key)
  console.log(`[CACHE-INVALIDATE] ${key}`)
}

/**
 * Invalide toutes les entrées du cache qui correspondent au pattern
 * @param pattern - Pattern de recherche (ex: "students-*")
 */
export function invalidateCachePattern(pattern: string): void {
  const regex = new RegExp(pattern.replace('*', '.*'))
  let count = 0
  
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key)
      count++
    }
  }
  
  console.log(`[CACHE-INVALIDATE-PATTERN] ${pattern} - ${count} entries removed`)
}

/**
 * Vide complètement le cache
 */
export function clearCache(): void {
  const size = cache.size
  cache.clear()
  console.log(`[CACHE-CLEAR] ${size} entries removed`)
}

/**
 * Retourne les statistiques du cache
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  }
}
