import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { STRIPE_PRICE_IDS } from "@/lib/stripe/prices";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
});

export async function POST(request: NextRequest) {
  try {
    const { plan, userId } = await request.json();

    if (!plan || !userId) {
      return NextResponse.json(
        { error: "Plan e userId são obrigatórios" },
        { status: 400 }
      );
    }

    // Plano free não precisa de checkout
    if (plan === "free") {
      return NextResponse.json(
        { error: "Plano free não requer pagamento" },
        { status: 400 }
      );
    }

    // Obter Price ID baseado no plano
    const priceId = plan === "pro" ? STRIPE_PRICE_IDS.pro : STRIPE_PRICE_IDS.premium;

    if (!priceId) {
      console.error(`❌ [Stripe Checkout] Price ID não configurado para plano: ${plan}`);
      return NextResponse.json(
        { error: `Configuração de preço não encontrada para o plano ${plan}. Entre em contato com o suporte.` },
        { status: 500 }
      );
    }

    console.log(`📝 [Stripe Checkout] Criando sessão para plano ${plan} com Price ID: ${priceId}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId, // Usar Price ID ao invés de criar dinamicamente
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${request.nextUrl.origin}/dashboard/conta?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/dashboard/conta?canceled=true`,
      metadata: {
        userId,
        plan,
      },
      // Permitir que o Stripe crie o customer automaticamente
      customer_creation: "always",
    });

    if (!session.url) {
      console.error("Stripe session created without URL", session);
      return NextResponse.json(
        { error: "Não foi possível iniciar o checkout." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (error: any) {
    console.error("Erro ao criar sessão Stripe:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

