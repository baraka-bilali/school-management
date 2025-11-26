import { prisma } from "./prisma"

/**
 * Exécute une opération Prisma avec retry automatique en cas d'erreur de connexion
 * @param operation - Fonction async qui effectue l'opération Prisma
 * @param maxRetries - Nombre maximum de tentatives (défaut: 3)
 * @param retryDelay - Délai entre les tentatives en ms (défaut: 1000)
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Assurer la connexion avant chaque tentative
      if (attempt > 1) {
        await prisma.$disconnect()
        await prisma.$connect()
        console.log(`[DB-RETRY] Attempt ${attempt}/${maxRetries} after reconnection`)
      }
      
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Vérifier si c'est une erreur de connexion
      const isConnectionError = 
        error.code === 'P1001' || // Can't reach database server
        error.code === 'P1002' || // Database server timeout
        error.code === 'P1008' || // Operations timed out
        error.code === 'P1017'    // Server has closed the connection
      
      if (isConnectionError && attempt < maxRetries) {
        console.warn(`[DB-RETRY] Connection error on attempt ${attempt}/${maxRetries}:`, error.message)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        continue
      }
      
      // Si ce n'est pas une erreur de connexion ou si on a épuisé les tentatives
      throw error
    }
  }
  
  throw lastError
}
