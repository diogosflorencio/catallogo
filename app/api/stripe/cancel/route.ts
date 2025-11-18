import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyIdToken } from "@/lib/firebase/admin";
import { updateUserProfile, getUserProfile } from "@/lib/supabase/database";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY não configurada");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log("🔵 [CANCEL] Iniciando processo de cancelamento");

    // 1. AUTENTICAÇÃO
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("❌ [CANCEL] Token não fornecido");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    console.log(`✅ [CANCEL] Usuário autenticado: ${userId}`);

    // 2. BUSCAR PERFIL
    const profile = await getUserProfile(userId);
    if (!profile) {
      console.error(`❌ [CANCEL] Perfil não encontrado: ${userId}`);
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    console.log(
      `✅ [CANCEL] Perfil encontrado - Plano: ${profile.plano} | SubID: ${
        profile.stripe_subscription_id || "null"
      }`
    );

    // 3. VALIDAÇÕES
    if (profile.plano === "free") {
      console.log(`⚠️ [CANCEL] Usuário já está no plano free`);
      return NextResponse.json(
        {
          error: "Você já está no plano gratuito",
          plan: "free",
        },
        { status: 400 }
      );
    }

    if (!profile.stripe_subscription_id) {
      console.warn(`⚠️ [CANCEL] Sem subscription_id. Fazendo downgrade local apenas.`);

      await updateUserProfile(userId, {
        plano: "free",
        stripe_subscription_id: null,
      });

      return NextResponse.json({
        message: "Plano alterado para Free",
        plan: "free",
        note: "Nenhuma assinatura ativa encontrada no Stripe",
      });
    }

    const subscriptionId = profile.stripe_subscription_id;
    console.log(`🔵 [CANCEL] Tentando cancelar subscription: ${subscriptionId}`);

    // 4. VERIFICAR E CANCELAR NO STRIPE
    try {
      // Buscar subscription atual — NA SUA API NÃO EXISTE .data
      const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
console.log("RAW SUBSCRIPTION:", JSON.stringify(currentSubscription, null, 2));


      // Se já está cancelada
      if (currentSubscription.status === "canceled") {
        console.log(`⚠️ [CANCEL] Subscription já estava cancelada no Stripe`);

        await updateUserProfile(userId, {
          plano: "free",
          stripe_subscription_id: null,
        });

        return NextResponse.json({
          message: "Assinatura já estava cancelada. Banco de dados sincronizado.",
          plan: "free",
        });
      }

      // CANCELAR IMEDIATAMENTE
      console.log(`🔴 [CANCEL] EXECUTANDO CANCELAMENTO NO STRIPE AGORA...`);

      const canceledSubscription: Stripe.Subscription =
        await stripe.subscriptions.cancel(subscriptionId);

      console.log(`✅ [CANCEL] CANCELAMENTO EXECUTADO COM SUCESSO:`, {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        canceled_at: canceledSubscription.canceled_at
          ? new Date(canceledSubscription.canceled_at * 1000).toISOString()
          : null,
        ended_at: canceledSubscription.ended_at
          ? new Date(canceledSubscription.ended_at * 1000).toISOString()
          : null,
      });

      // 5. ATUALIZAR BANCO
      console.log(`🔵 [CANCEL] Atualizando banco de dados...`);

      await updateUserProfile(userId, {
        plano: "free",
        stripe_subscription_id: null,
      });

      const totalTime = Date.now() - startTime;
      console.log(`✅ [CANCEL] PROCESSO COMPLETO! (${totalTime}ms)`);

      return NextResponse.json({
        success: true,
        message: "Assinatura cancelada com sucesso! Você não será mais cobrado.",
        plan: "free",
        canceledAt: new Date().toISOString(),
        details: {
          subscriptionId: canceledSubscription.id,
          status: canceledSubscription.status,
          processTime: `${totalTime}ms`,
        },
      });
    } catch (stripeError: any) {
      console.error(`❌ [CANCEL] ERRO DO STRIPE:`, {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        statusCode: stripeError.statusCode,
        raw: stripeError.raw,
      });

      // Subscription não existe no Stripe
      if (
        stripeError.code === "resource_missing" ||
        stripeError.statusCode === 404 ||
        stripeError.type === "invalid_request_error"
      ) {
        console.log(`⚠️ [CANCEL] Subscription não existe no Stripe. Sincronizando banco...`);

        await updateUserProfile(userId, {
          plano: "free",
          stripe_subscription_id: null,
        });

        return NextResponse.json({
          message: "Plano alterado para Free (assinatura não encontrada no Stripe)",
          plan: "free",
          note: "A assinatura já não existia mais no Stripe",
        });
      }

      throw new Error(`Erro do Stripe: ${stripeError.message} (${stripeError.code})`);
    }
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [CANCEL] ERRO FATAL (${totalTime}ms):`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao cancelar assinatura",
        details:
          process.env.NODE_ENV === "development"
            ? {
                stack: error.stack,
                name: error.name,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
