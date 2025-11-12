import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export function formatWhatsAppNumber(number: string): string {
  // Remove todos os caracteres não numéricos
  const cleaned = number.replace(/\D/g, "");
  // Se não começar com 55, adiciona
  if (!cleaned.startsWith("55")) {
    return `55${cleaned}`;
  }
  return cleaned;
}

export function generateWhatsAppLink(
  number: string,
  message: string
): string {
  const formattedNumber = formatWhatsAppNumber(number);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
}

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  });
  return result;
}

