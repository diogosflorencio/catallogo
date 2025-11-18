import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateUserProfile } from "@/lib/supabase/database";
import { supabaseAdmin } from "@/lib/supabase/server";
import { STRIPE_PRICE_IDS } from "@/lib/stripe/prices";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
});

type SupportedPlan = "free" | "pro" | "premium";

const normalizePlan = (plan?: string | null): SupportedPlan | null => {
  if (plan === "free" || plan === "pro" || plan === "premium") {
    return plan;
  }
  return null;
};

const priceIdToPlan = (priceId?: string | null): SupportedPlan | null => {
  if (!priceId) return null;
  if (priceId === STRIPE_PRICE_IDS.pro) return "pro";
  if (priceId === STRIPE_PRICE_IDS.premium) return "premium";
  return null;
};

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
        const planFromMetadata = normalizePlan(session.metadata?.plan);

        if (userId) {
          console.log(`✅ [Webhook] Checkout completado - Usuário: ${userId}, Plano (metadata): ${planFromMetadata}`);
          
          // Obter customer_id e subscription_id da sessão
          // No modo subscription, o Stripe cria automaticamente customer e subscription
          let customerId: string | null = null;
          let subscriptionId: string | null = null;

          // session.customer pode ser string (ID) ou objeto Customer expandido
          if (session.customer) {
            customerId = typeof session.customer === "string" 
              ? session.customer 
              : (session.customer as Stripe.Customer).id;
          }

          let subscription: Stripe.Subscription | null = null;

          // session.subscription pode ser string (ID) ou objeto Subscription expandido
          if (session.subscription) {
            const sessionSubscriptionId = typeof session.subscription === "string" 
              ? session.subscription 
              : (session.subscription as Stripe.Subscription).id;
            try {
              subscription = await stripe.subscriptions.retrieve(sessionSubscriptionId);
              subscriptionId = subscription.id;
              console.log("🔥 [Webhook] Assinatura carregada via Stripe:", {
                subscriptionId,
                status: subscription.status,
              });
            } catch (error) {
              console.warn("⚠️ [Webhook] Não foi possível recuperar subscription diretamente da sessão:", error);
              subscriptionId = sessionSubscriptionId;
            }
          }

          // Se ainda não temos subscription, tentar refetch da sessão
          if (!subscriptionId) {
            try {
              console.log("ℹ️ [Webhook] Rebuscando sessão para obter subscription...");
              const freshSession = await stripe.checkout.sessions.retrieve(session.id, {
                expand: ["subscription"],
              });
              if (freshSession.subscription) {
                if (typeof freshSession.subscription === "string") {
                  subscriptionId = freshSession.subscription;
                } else {
                  subscription = freshSession.subscription;
                  subscriptionId = subscription.id;
                }
              }
            } catch (error) {
              console.warn("⚠️ [Webhook] Falha ao rebuscar sessão:", error);
            }
          }

          // Se ainda não encontrou subscription_id na sessão, buscar no customer
          if (customerId && !subscriptionId) {
            try {
              const subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: "active",
                limit: 1,
              });
              if (subscriptions.data.length > 0) {
                subscription = subscriptions.data[0];
                subscriptionId = subscription.id;
              }
            } catch (error) {
              console.warn("⚠️ [Webhook] Erro ao buscar subscriptions do customer:", error);
            }
          }

          const planToPersist =
            planFromMetadata ||
            normalizePlan(subscription?.metadata?.plan) ||
            priceIdToPlan(subscription?.items?.data?.[0]?.price?.id);

          if (!planToPersist) {
            console.warn("⚠️ [Webhook] Plano não identificado para a assinatura", {
              planFromMetadata,
              subscriptionMetadataPlan: subscription?.metadata?.plan,
              priceId: subscription?.items?.data?.[0]?.price?.id,
            });
          }

          // Atualizar perfil com plano e IDs do Stripe
          await updateUserProfile(userId, {
            plano: planToPersist || "pro",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          });

          console.log(`✅ [Webhook] IDs salvos - Customer: ${customerId}, Subscription: ${subscriptionId}`);
        } else {
          console.warn("⚠️ [Webhook] Checkout completado mas metadata incompleta:", { userId, plan: planFromMetadata });
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

        const plan =
          normalizePlan(subscription.metadata?.plan) ||
          priceIdToPlan(subscription.items?.data?.[0]?.price?.id);

        if (!userId) {
          console.warn("⚠️ [Webhook] Subscription criada sem metadata.userId", {
            subscriptionId: subscription.id,
          });
          break;
        }

        if (!plan) {
          console.warn("⚠️ [Webhook] Subscription criada sem plano identificável", {
            subscriptionId: subscription.id,
            metadataPlan: subscription.metadata?.plan,
          });
        }

        await updateUserProfile(userId, {
          plano: plan || "pro",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
        });
        console.log(`✅ [Webhook] Subscription criada registrada para usuário ${userId}`);
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
        // subscription.customer pode ser string (ID) ou objeto Customer expandido
        const customerId = typeof subscription.customer === "string" 
          ? subscription.customer 
          : (subscription.customer as Stripe.Customer).id;

        const userIdFromMetadata = subscription.metadata?.userId;
        
        console.log(`ℹ️ [Webhook] Subscription deletada: ${subscription.id}, Customer: ${customerId}`);
        
        if (userIdFromMetadata) {
          await updateUserProfile(userIdFromMetadata, {
            plano: "free",
            stripe_subscription_id: null,
          });
          console.log(`✅ [Webhook] Usuário ${userIdFromMetadata} downgradeado para free via metadata`);
          break;
        }

        // Buscar usuário pelo stripe_customer_id
        if (customerId && supabaseAdmin) {
          const { data: users } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .limit(1);
          
          if (users && users.length > 0) {
            const userId = users[0].id;
            await updateUserProfile(userId, {
              plano: "free",
              stripe_subscription_id: null, // Limpar subscription_id quando cancelada
            });
            console.log(`✅ [Webhook] Usuário ${userId} downgradeado para free após cancelamento`);
          } else {
            console.warn(`⚠️ [Webhook] Usuário não encontrado para customer_id: ${customerId}`);
          }
        } else if (!supabaseAdmin) {
          console.error("❌ [Webhook] Supabase não está configurado");
        }
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

