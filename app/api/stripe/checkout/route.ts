import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { STRIPE_PRICE_IDS } from "@/lib/stripe/prices";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
});

export async function POST(request: NextRequest) {
  try {
    // Verificar se a chave secreta do Stripe está configurada
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("❌ [Stripe Checkout] STRIPE_SECRET_KEY não está configurada!");
      return NextResponse.json(
        { error: "Configuração do Stripe incompleta. Entre em contato com o suporte." },
        { status: 500 }
      );
    }

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
      const missingVar = plan === "pro" ? "STRIPE_PRICE_ID_PRO" : "STRIPE_PRICE_ID_PREMIUM";
      console.error(`❌ [Stripe Checkout] Price ID não configurado para plano: ${plan}`);
      console.error(`❌ [Stripe Checkout] Variável de ambiente ausente: ${missingVar}`);
      return NextResponse.json(
        { 
          error: `Configuração de preço não encontrada para o plano ${plan}. Verifique se a variável de ambiente ${missingVar} está configurada no Vercel.` 
        },
        { status: 500 }
      );
    }

    console.log(`📝 [Stripe Checkout] Criando sessão para plano ${plan} com Price ID: ${priceId}`);

    // Verificar se o Price ID existe e está ativo no Stripe
    try {
      const price = await stripe.prices.retrieve(priceId);
      console.log(`✅ [Stripe Checkout] Price encontrado: ${price.id}, Ativo: ${price.active}, Moeda: ${price.currency}`);
      
      if (!price.active) {
        console.error(`❌ [Stripe Checkout] Price ${priceId} não está ativo!`);
        return NextResponse.json(
          { error: "O plano selecionado não está disponível. Entre em contato com o suporte." },
          { status: 400 }
        );
      }
    } catch (priceError: any) {
      console.error(`❌ [Stripe Checkout] Erro ao verificar Price ID:`, priceError);
      return NextResponse.json(
        { error: `Price ID inválido ou não encontrado. Verifique a configuração.` },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId, // Usar Price ID ao invés de criar dinamicamente
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        metadata: {
          userId,
          plan,
        },
      },
      locale: "pt-BR", // Configurar locale para português brasileiro (resolve erro "Cannot find module './en'")
      success_url: `${request.nextUrl.origin}/dashboard/conta?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/dashboard/conta?canceled=true`,
      metadata: {
        userId,
        plan,
      },
      // No modo "subscription", o Stripe cria o customer automaticamente
      // Configurações adicionais para melhor compatibilidade
      // billing_address_collection: "auto", // Comentado temporariamente para debug
      allow_promotion_codes: false,
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
    console.error("❌ [Stripe Checkout] Erro ao criar sessão Stripe:", error);
    console.error("❌ [Stripe Checkout] Detalhes do erro:", {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      raw: error.raw, // Detalhes completos do erro do Stripe
    });
    
    // Mensagem de erro mais amigável
    let errorMessage = "Erro ao processar pagamento. Tente novamente.";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.type === "StripeInvalidRequestError") {
      errorMessage = "Erro na configuração do Stripe. Verifique os Price IDs configurados.";
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

