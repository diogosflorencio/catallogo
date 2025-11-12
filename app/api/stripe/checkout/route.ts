import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Plano ${plan.toUpperCase()} - Catallogo`,
            },
            recurring: {
              interval: "month",
            },
            unit_amount: plan === "free" ? 0 : plan === "pro" ? 2990 : 7990,
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${request.nextUrl.origin}/dashboard/conta?success=true`,
      cancel_url: `${request.nextUrl.origin}/dashboard/conta?canceled=true`,
      metadata: {
        userId,
        plan,
      },
    });

    if (!session.url) {
      console.error("Stripe session created without URL", session);
      return NextResponse.json(
        { error: "Não foi possível iniciar o checkout." },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId: session.id, sessionUrl: session.url });
  } catch (error: any) {
    console.error("Erro ao criar sessão Stripe:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

