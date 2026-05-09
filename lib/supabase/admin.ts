import { createClient } from '@supabase/supabase-js'

// Cria um cliente com privilégios administrativos (Service Role)
// IMPORTANTE: Use APENAS em Server Components ou Server Actions!
// Isso ignora as políticas de RLS e tem acesso total ao banco.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
