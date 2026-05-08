"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

// Configuration optimisée pour réduire les appels API
const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache les données pendant 5 minutes
      staleTime: 5 * 60 * 1000,
      // Garde les données en cache pendant 10 minutes même si non utilisées
      gcTime: 10 * 60 * 1000,
      // Retry 2 fois en cas d'erreur
      retry: 2,
      // Pas de refetch automatique au focus
      refetchOnWindowFocus: false,
      // Pas de refetch automatique au reconnect
      refetchOnReconnect: false,
    },
  },
}

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(queryClientConfig))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
