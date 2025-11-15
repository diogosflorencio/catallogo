import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateUserProfile } from "@/lib/supabase/database";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Assinatura não encontrada" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Erro ao verificar webhook:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId && plan) {
          console.log(`✅ [Webhook] Checkout completado - Usuário: ${userId}, Plano: ${plan}`);
          await updateUserProfile(userId, {
            plano: plan as "free" | "pro" | "premium",
          });
        } else {
          console.warn("⚠️ [Webhook] Checkout completado mas metadata incompleta:", { userId, plan });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        // Se a subscription foi atualizada (mudança de plano, etc)
        // Por enquanto, mantemos o plano baseado no metadata do checkout
        // Em uma implementação completa, você poderia mapear price_id -> plano
        console.log(`ℹ️ [Webhook] Subscription atualizada: ${subscription.id}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        // Quando a subscription é cancelada, fazer downgrade para free
        // Nota: O customer_id precisa estar armazenado no perfil do usuário
        // Por enquanto, o cancelamento é feito manualmente via /api/stripe/cancel
        console.log(`ℹ️ [Webhook] Subscription deletada: ${subscription.id}`);
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

