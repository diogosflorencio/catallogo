import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Esta key será usada apenas no client para operações públicas
// Para operações sensíveis, usar Functions do Firebase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Usando a publishable key fornecida
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable__PMwkXT5prwAdbJIXQebkA_VrG-4-yh";

// Garantir apenas uma instância do cliente Supabase
let supabase: SupabaseClient | null = null;

if (typeof window !== "undefined") {
  // Só criar no cliente
  if (supabaseUrl && supabaseAnonKey) {
    try {
      // Verificar se já existe uma instância global
      if (!(window as any).__supabase) {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        (window as any).__supabase = supabase;
      } else {
        supabase = (window as any).__supabase;
      }
    } catch (error) {
      console.error("Erro ao criar cliente Supabase:", error);
      console.warn("Verifique se as variáveis de ambiente do Supabase estão configuradas no arquivo .env.local");
    }
  } else {
    console.warn("Supabase não configurado. Configure as variáveis de ambiente no arquivo .env.local");
  }
}

export { supabase };

// Tipos para analytics
export interface AnalyticsEvent {
  type: "view" | "whatsapp_click";
  username: string;
  catalogSlug: string;
  produtoId?: string;
  timestamp: Date;
}

export interface AnalyticsEventRow {
  id: string;
  type: "view" | "whatsapp_click";
  username: string;
  catalog_slug: string;
  produto_id: string | null;
  timestamp: string;
}

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  // ANALYTICS DESATIVADO TEMPORARIAMENTE
  // Para economizar no plano gratuito do banco de dados
  // TODO: Reativar quando implementar versão premium com analytics
  // A lógica está mantida para uso futuro - apenas a inserção no banco está comentada
  
  // if (!supabase) {
  //   console.warn("Supabase não configurado. Evento não registrado.");
  //   return;
  // }
  // try {
  //   // Esta função será chamada do client, mas os dados sensíveis
  //   // devem ser processados via Firebase Functions
  //   await supabase.from("analytics_events").insert({
  //     type: event.type,
  //     username: event.username,
  //     catalog_slug: event.catalogSlug,
  //     produto_id: event.produtoId || null,
  //     timestamp: event.timestamp.toISOString(),
  //   });
  // } catch (error) {
  //   console.error("Erro ao registrar evento:", error);
  //   // Não bloquear a aplicação se analytics falhar
  // }
  
  // Retornar sem erro para não quebrar o código que chama esta função
  return;
}

