import { createClient } from "@supabase/supabase-js"

// Client serveur — utilise la service role key (ne jamais exposer côté client)
// Utilisé pour broadcaster les notifications depuis les API routes
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
