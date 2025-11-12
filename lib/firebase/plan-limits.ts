import { UserProfile } from "@/lib/supabase/database";
import { PLANS, PlanType } from "@/lib/stripe/config";

export function checkCatalogLimit(
  profile: UserProfile,
  currentCatalogCount: number
): { allowed: boolean; limit: number } {
  const plan = PLANS[profile.plano];
  // Usar o limite definido em PLANS (já controla casos de 'ilimitado' via número alto)
  const limit = plan.catalogos;
  return {
    allowed: currentCatalogCount < limit,
    limit: plan.catalogos,
  };
}

export function checkProductLimit(
  profile: UserProfile,
  currentProductCount: number,
  catalogoId?: string
): { allowed: boolean; limit: number } {
  const plan = PLANS[profile.plano];
  // Usar o limite definido em PLANS
  const limit = plan.produtos;
  
  return {
    allowed: currentProductCount < limit,
    limit: plan.produtos,
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

