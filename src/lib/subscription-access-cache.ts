/** Cache client de l’accès abonnement — affiche locks / Suspendu avant le réseau. */

export const SUBSCRIPTION_ACCESS_CACHE_KEY = "kelasi_subscription_access"

export type SubscriptionAccessCache = {
  expired: boolean
  etatCompte: string | null
  dateFinAbonnement: string | null
  dateDebutAbonnement?: string | null
  schoolName?: string | null
  daysLeft: number | null
  updatedAt: number
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

export function readSubscriptionAccessCache(): SubscriptionAccessCache | null {
  if (!canUseStorage()) return null
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_ACCESS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SubscriptionAccessCache
    if (typeof parsed?.expired !== "boolean") return null
    return parsed
  } catch {
    return null
  }
}

export function writeSubscriptionAccessCache(
  data: Omit<SubscriptionAccessCache, "updatedAt">
): void {
  if (!canUseStorage()) return
  try {
    const payload: SubscriptionAccessCache = {
      ...data,
      updatedAt: Date.now(),
    }
    localStorage.setItem(SUBSCRIPTION_ACCESS_CACHE_KEY, JSON.stringify(payload))
    window.dispatchEvent(new Event("subscriptionAccessUpdated"))
  } catch {
    // ignore quota / private mode
  }
}

export function clearSubscriptionAccessCache(): void {
  if (!canUseStorage()) return
  try {
    localStorage.removeItem(SUBSCRIPTION_ACCESS_CACHE_KEY)
    window.dispatchEvent(new Event("subscriptionAccessUpdated"))
  } catch {
    // ignore
  }
}

export function getCachedSubscriptionExpired(): boolean {
  return readSubscriptionAccessCache()?.expired === true
}
