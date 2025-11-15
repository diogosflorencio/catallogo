/**
 * Configuração dos Price IDs do Stripe
 * 
 * IMPORTANTE: Configure estas variáveis de ambiente no Vercel:
 * - STRIPE_PRICE_ID_PRO=price_xxxxx (Price ID do plano Pro)
 * - STRIPE_PRICE_ID_PREMIUM=price_xxxxx (Price ID do plano Premium)
 * 
 * Para encontrar os Price IDs:
 * 1. Acesse https://dashboard.stripe.com/products
 * 2. Clique no produto desejado
 * 3. Copie o "Price ID" (começa com price_)
 */

export const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_ID_PRO || "",
  premium: process.env.STRIPE_PRICE_ID_PREMIUM || "",
} as const;

// Validar se os Price IDs estão configurados
if (process.env.NODE_ENV === "production") {
  if (!STRIPE_PRICE_IDS.pro) {
    console.warn("⚠️ STRIPE_PRICE_ID_PRO não está configurado!");
  }
  if (!STRIPE_PRICE_IDS.premium) {
    console.warn("⚠️ STRIPE_PRICE_ID_PREMIUM não está configurado!");
  }
}


