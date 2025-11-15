import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyIdToken } from "@/lib/firebase/admin";
import { updateUserProfile, getUserProfile } from "@/lib/supabase/database";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {});

export async function POST(request: NextRequest) {
  try {
    // Verificar token do Firebase
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    // Buscar perfil do usuário
    const profile = await getUserProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    // Se o plano já é free, não há assinatura para cancelar
    if (profile.plano === "free") {
      return NextResponse.json({ error: "Você não possui uma assinatura ativa" }, { status: 400 });
    }

    // Verificar se há subscription_id no perfil
    if (!profile.stripe_subscription_id) {
      console.warn(`⚠️ [API /api/stripe/cancel] Usuário ${userId} não possui subscription_id. Fazendo downgrade apenas no banco.`);
      await updateUserProfile(userId, {
        plano: "free",
      });
      return NextResponse.json({ 
        message: "Assinatura cancelada com sucesso. Seu plano foi alterado para Free.",
        plan: "free"
      });
    }

    // Cancelar subscription no Stripe
    try {
      // Cancelar imediatamente (cancel_at_period_end: false)
      // Para testes - o usuário quer cancelamento imediato
      const canceledSubscription = await stripe.subscriptions.cancel(profile.stripe_subscription_id);
      
      console.log(`✅ [API /api/stripe/cancel] Subscription ${profile.stripe_subscription_id} cancelada no Stripe para usuário ${userId}`);
      
      // Fazer downgrade no banco imediatamente
      // O webhook customer.subscription.deleted também vai processar quando o Stripe confirmar
      await updateUserProfile(userId, {
        plano: "free",
        stripe_subscription_id: null, // Limpar subscription_id
      });

      return NextResponse.json({ 
        message: "Assinatura cancelada com sucesso. Seu plano foi alterado para Free e você não será mais cobrado.",
        plan: "free"
      });
    } catch (stripeError: any) {
      console.error(`❌ [API /api/stripe/cancel] Erro ao cancelar no Stripe:`, stripeError);
      
      // Se a subscription já foi cancelada ou não existe, fazer downgrade mesmo assim
      if (stripeError.code === "resource_missing" || stripeError.statusCode === 404) {
        await updateUserProfile(userId, {
          plano: "free",
          stripe_subscription_id: null,
        });
        return NextResponse.json({ 
          message: "Assinatura cancelada. Seu plano foi alterado para Free.",
          plan: "free"
        });
      }
      
      // Se houver outro erro, retornar erro
      throw new Error(`Erro ao cancelar assinatura no Stripe: ${stripeError.message}`);
    }
  } catch (error: any) {
    console.error("Erro ao cancelar assinatura:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao cancelar assinatura" },
      { status: 500 }
    );
  }
}

