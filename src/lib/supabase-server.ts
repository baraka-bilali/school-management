import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabaseAdminInstance: SupabaseClient | null = null

/** Client serveur (service role) — initialisation paresseuse pour ne pas casser le build Next.js */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) return supabaseAdminInstance

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      "Supabase non configuré : définissez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY"
    )
  }

  supabaseAdminInstance = createClient(url, key)
  return supabaseAdminInstance
}
