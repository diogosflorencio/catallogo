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

    // Buscar assinatura ativa do Stripe pelo customer ID (se houver)
    // Por enquanto, vamos apenas fazer downgrade para free
    // Em uma implementação completa, você precisaria armazenar o customer_id do Stripe
    await updateUserProfile(userId, {
      plano: "free",
    });

    return NextResponse.json({ 
      message: "Assinatura cancelada com sucesso. Seu plano foi alterado para Free.",
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

