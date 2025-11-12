import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateUserProfile } from "@/lib/supabase/database";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {});

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId é obrigatório" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    if (!userId || !plan) {
      return NextResponse.json(
        { error: "Dados da assinatura incompletos." },
        { status: 400 }
      );
    }

    await updateUserProfile(userId, {
      plano: plan as "free" | "pro" | "premium",
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error("Erro ao confirmar assinatura:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}


