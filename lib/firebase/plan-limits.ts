import { UserProfile } from "@/lib/supabase/database";
import { PLANS, PlanType } from "@/lib/stripe/config";

export function checkCatalogLimit(
  profile: UserProfile,
  currentCatalogCount: number
): { allowed: boolean; limit: number } {
  const plan = PLANS[profile.plano];
  // Premium: mostrado como "ilimitado" mas limitado a 50 no código
  // Outros planos: usar o valor direto
  const limit = plan.catalogos === -1 ? 50 : plan.catalogos;
  return {
    allowed: currentCatalogCount < limit,
    limit: plan.catalogos === -1 ? 50 : plan.catalogos,
  };
}

export function checkProductLimit(
  profile: UserProfile,
  currentProductCount: number,
  catalogoId?: string
): { allowed: boolean; limit: number } {
  const plan = PLANS[profile.plano];
  // Pro e Premium: mostrado como "ilimitado" mas limitado a 100 no código
  // Free: 3 produtos por catálogo
  const limit = plan.produtos === -1 ? 100 : plan.produtos;
  
  return {
    allowed: currentProductCount < limit,
    limit: plan.produtos === -1 ? 100 : plan.produtos,
  };
}

export function canCreateCatalog(
  profile: UserProfile,
  currentCatalogCount: number
): boolean {
  return checkCatalogLimit(profile, currentCatalogCount).allowed;
}

export function canCreateProduct(
  profile: UserProfile,
  currentProductCount: number,
  catalogoId?: string
): boolean {
  return checkProductLimit(profile, currentProductCount, catalogoId).allowed;
}

