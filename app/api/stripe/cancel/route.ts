import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyIdToken } from "@/lib/firebase/admin";
import { updateUserProfile, getUserProfile } from "@/lib/supabase/database";

// Verificar se a chave existe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY não configurada");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover", // Mesma versão do webhook
});

export async function POST(request: NextRequest) {
  try {
    console.log("🔵 [API /api/stripe/cancel] Iniciando cancelamento");

    // 1. Verificar autenticação
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("❌ [API /api/stripe/cancel] Token não fornecido");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decodedToken;
    
    try {
      decodedToken = await verifyIdToken(token);
    } catch (authError) {
      console.error("❌ [API /api/stripe/cancel] Erro ao verificar token:", authError);
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const userId = decodedToken.uid;
    console.log(`🔵 [API /api/stripe/cancel] Usuário autenticado: ${userId}`);

    // 2. Buscar perfil do usuário
    const profile = await getUserProfile(userId);
    if (!profile) {
      console.error(`❌ [API /api/stripe/cancel] Perfil não encontrado para ${userId}`);
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    console.log(`🔵 [API /api/stripe/cancel] Perfil encontrado. Plano atual: ${profile.plano}`);

    // 3. Verificar se já é free
    if (profile.plano === "free") {
      console.log(`⚠️ [API /api/stripe/cancel] Usuário ${userId} já está no plano free`);
      return NextResponse.json({ 
        error: "Você já está no plano gratuito",
        plan: "free"
      }, { status: 400 });
    }

    // 4. Verificar subscription_id
    if (!profile.stripe_subscription_id) {
      console.warn(`⚠️ [API /api/stripe/cancel] Usuário ${userId} sem subscription_id. Fazendo downgrade direto.`);
      
      await updateUserProfile(userId, {
        plano: "free",
        stripe_subscription_id: null,
      });

      return NextResponse.json({ 
        message: "Seu plano foi alterado para Free.",
        plan: "free"
      });
    }

    // 5. Cancelar no Stripe
    console.log(`🔵 [API /api/stripe/cancel] Cancelando subscription ${profile.stripe_subscription_id}`);

    try {
      // Primeiro, verificar se a subscription existe
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      
      console.log(`🔵 [API /api/stripe/cancel] Subscription encontrada. Status: ${subscription.status}`);

      // Se já está cancelada, apenas atualizar banco
      if (subscription.status === "canceled") {
        console.log(`⚠️ [API /api/stripe/cancel] Subscription já estava cancelada`);
        
        await updateUserProfile(userId, {
          plano: "free",
          stripe_subscription_id: null,
        });

        return NextResponse.json({ 
          message: "Seu plano foi alterado para Free.",
          plan: "free"
        });
      }

      // Cancelar imediatamente
      const canceledSubscription = await stripe.subscriptions.cancel(
        profile.stripe_subscription_id
      );
      
      console.log(`✅ [API /api/stripe/cancel] Subscription cancelada. Novo status: ${canceledSubscription.status}`);

      // Atualizar banco de dados
      await updateUserProfile(userId, {
        plano: "free",
        stripe_subscription_id: null,
      });

      console.log(`✅ [API /api/stripe/cancel] Perfil atualizado para free`);

      return NextResponse.json({ 
        message: "Assinatura cancelada com sucesso. Seu plano foi alterado para Free e você não será mais cobrado.",
        plan: "free",
        canceledAt: new Date().toISOString()
      });

    } catch (stripeError: any) {
      console.error(`❌ [API /api/stripe/cancel] Erro do Stripe:`, {
        code: stripeError.code,
        type: stripeError.type,
        message: stripeError.message,
        statusCode: stripeError.statusCode
      });

      // Se a subscription não existe mais, fazer downgrade
      if (
        stripeError.code === "resource_missing" || 
        stripeError.statusCode === 404 ||
        stripeError.type === "invalid_request_error"
      ) {
        console.log(`⚠️ [API /api/stripe/cancel] Subscription não encontrada. Fazendo downgrade.`);
        
        await updateUserProfile(userId, {
          plano: "free",
          stripe_subscription_id: null,
        });

        return NextResponse.json({ 
          message: "Seu plano foi alterado para Free.",
          plan: "free"
        });
      }

      // Outros erros do Stripe
      throw stripeError;
    }

  } catch (error: any) {
    console.error("❌ [API /api/stripe/cancel] Erro geral:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "Erro ao cancelar assinatura",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}