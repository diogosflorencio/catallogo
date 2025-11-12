import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";

export const stripePromise: Promise<StripeJs | null> = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

export async function redirectToCheckoutClient(sessionId: string): Promise<void> {
	const stripe: StripeJs | null = await stripePromise;
	if (!stripe) {
		throw new Error("Stripe.js não carregou");
	}
	await stripe.redirectToCheckout({ sessionId });
}

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    catalogos: 1, // 1 catálogo
    produtos: 3, // 3 itens por catálogo
    features: ["1 catálogo", "3 itens por catálogo", "URL personalizada", "Tempo ilimitado", "Suporte atencioso"],
  },
  pro: {
    name: "Pro",
    price: 29.90,
    catalogos: 1, // 1 catálogo
    produtos: 100, // máximo 100 produtos (mostrado como ilimitado)
    features: ["1 catálogo", "Produtos ilimitados", "URL personalizada", "Suporte instantâneo"],
  },
  premium: {
    name: "Premium",
    price: 79.90,
    catalogos: 50, // máximo 50 catálogos (mostrado como ilimitado)
    produtos: 100, // máximo 100 produtos por catálogo (mostrado como ilimitado)
    features: [
      "Catálogos ilimitados",
      "Produtos ilimitados",
      "URL personalizada",
      "Suporte instantâneo",
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;

