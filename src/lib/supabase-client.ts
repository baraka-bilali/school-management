"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabaseBrowserInstance: SupabaseClient | null = null

/** Client browser (anon key) — initialisation paresseuse, appelé dans useEffect uniquement */
export function getSupabaseBrowser(): SupabaseClient {
  if (supabaseBrowserInstance) return supabaseBrowserInstance

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      "Supabase non configuré : définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
  }

  supabaseBrowserInstance = createClient(url, key)
  return supabaseBrowserInstance
}
