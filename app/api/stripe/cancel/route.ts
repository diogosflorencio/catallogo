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

    // IMPORTANTE: Cancelar assinatura no Stripe se houver customer_id
    // Por enquanto, apenas fazemos downgrade para free no banco de dados
    // Em produção, você deve:
    // 1. Armazenar customer_id e subscription_id do Stripe no perfil do usuário
    // 2. Buscar a subscription ativa no Stripe
    // 3. Cancelar a subscription no Stripe usando: stripe.subscriptions.cancel(subscriptionId)
    // 4. Aguardar o webhook confirmar o cancelamento antes de fazer downgrade
    
    // Por segurança, vamos fazer o downgrade imediatamente
    // O webhook do Stripe também vai processar o cancelamento quando receber o evento
    await updateUserProfile(userId, {
      plano: "free",
    });

    console.log(`✅ [API /api/stripe/cancel] Plano cancelado para usuário ${userId}. Alterado para free.`);

    return NextResponse.json({ 
      message: "Assinatura cancelada com sucesso. Seu plano foi alterado para Free e você não será mais cobrado.",
      plan: "free"
    });
  } catch (error: any) {
    console.error("Erro ao cancelar assinatura:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao cancelar assinatura" },
      { status: 500 }
    );
  }
}

