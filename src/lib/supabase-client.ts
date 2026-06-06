"use client"

import { createClient } from "@supabase/supabase-js"

// Client browser — utilise l'anon key (sûr côté client)
// Utilisé pour les abonnements Realtime Broadcast
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
