import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cliente do Supabase para uso no servidor (com service role key)
// Esta key deve ser usada apenas em API routes e server components
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Usando a secret key fornecida
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_hvD2UHD1iiUcOU6Ebo5-Mw_mBnbHSpl";

let supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (error) {
    console.error("Erro ao criar cliente Supabase Admin:", error);
    console.warn("Verifique se as variáveis de ambiente do Supabase estão configuradas no arquivo .env.local");
  }
} else {
  console.warn("Supabase Admin não configurado. Configure SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local");
}

export { supabaseAdmin };

