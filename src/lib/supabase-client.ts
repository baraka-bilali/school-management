"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabaseBrowserInstance: SupabaseClient | null = null
let supabaseUnavailable = false

/** Client browser (anon key) — initialisation paresseuse, appelé dans useEffect uniquement */
export function getSupabaseBrowser(): SupabaseClient {
  const client = tryGetSupabaseBrowser()
  if (!client) {
    throw new Error(
      "Supabase non configuré : définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
  }
  return client
}

/** Retourne null si Supabase n'est pas configuré (dev / preview sans clés). */
export function tryGetSupabaseBrowser(): SupabaseClient | null {
  if (supabaseBrowserInstance) return supabaseBrowserInstance
  if (supabaseUnavailable) return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    supabaseUnavailable = true
    return null
  }

  supabaseBrowserInstance = createClient(url, key)
  return supabaseBrowserInstance
}
