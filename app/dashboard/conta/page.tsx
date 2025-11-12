"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { checkUsernameExists } from "@/lib/supabase/database";
import { UserProfile } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PLANS, PlanType } from "@/lib/stripe/config";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import { signOut } from "@/lib/firebase/auth-simple";
import Link from "next/link";

function CheckoutHandler({ onConfirm }: { onConfirm: (sessionId: string) => void }) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [hasHandled, setHasHandled] = useState(false);

  useEffect(() => {
    if (hasHandled) return;
    
    const success = searchParams.get("success");
    const sessionId = searchParams.get("session_id");

    if (
      user &&
      success === "true" &&
      sessionId
    ) {
      onConfirm(sessionId);
      setHasHandled(true);
    }
  }, [searchParams, user, onConfirm, hasHandled]);

  return null;
}

export default function ContaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nomeLoja: "",
    username: "",
    whatsappNumber: "",
    mensagemTemplate: "",
  });
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    // Exigir login
    if (!loading && !user) {
      router.push("/perfil");
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, loading, router]);

  async function loadData() {
    if (!user) return;
    
    try {
      // Buscar perfil via API route
      const token = await user.getIdToken();
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userProfile = await response.json();
        setProfile(userProfile);
        setFormData({
          nomeLoja: userProfile.nome_loja || "",
          username: userProfile.username || "",
          whatsappNumber: userProfile.whatsapp_number || "",
          mensagemTemplate: userProfile.mensagem_template || "",
        });
      } else {
        console.error("Erro ao buscar perfil:", await response.text());
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }

  async function handleSave() {
    if (!user) {
      alert("Você precisa fazer login para editar seu perfil");
      return;
    }
    if (!profile) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();

      // Se username mudou, atualizar
      if (formData.username !== profile.username) {
        const exists = await checkUsernameExists(formData.username.toLowerCase());
        if (exists) {
          setUsernameError("Username já está em uso");
          setSaving(false);
          return;
        }
        
        const usernameResponse = await fetch("/api/user/username", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: formData.username.toLowerCase(),
          }),
        });

        if (!usernameResponse.ok) {
          const errorData = await usernameResponse.json();
          setUsernameError(errorData.error || "Erro ao atualizar username");
          setSaving(false);
          return;
        }
      }

      // Atualizar outros campos
      const updateResponse = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            nome_loja: formData.nomeLoja,
            whatsapp_number: formData.whatsappNumber,
            mensagem_template: formData.mensagemTemplate,
          },
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Erro ao atualizar perfil");
      }

      await loadData();
      alert("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      if (error.message.includes("Username")) {
        setUsernameError(error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmCheckout(sessionId: string) {
    try {
      const response = await fetch("/api/stripe/checkout/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        console.error("Erro ao confirmar assinatura:", await response.text());
        return;
      }

      await loadData();
      setCheckoutConfirmed(true);
      router.replace("/dashboard/conta?success=true");
    } catch (error) {
      console.error("Erro ao confirmar assinatura:", error);
    }
  }

  async function handleUpgrade(plan: PlanType) {
    if (!user) return;
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userId: user.uid }),
      });

      const { sessionUrl, sessionId } = await response.json();
      if (!sessionUrl) {
        throw new Error("URL da sessão Stripe não recebida.");
      }
      if (sessionId) {
        setCheckoutConfirmed(false);
      }
      window.location.href = sessionUrl;
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lavender">Carregando...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Será redirecionado pelo useEffect
  }

  return (
    <DashboardLayout profile={profile}>
      <Suspense fallback={<div className="hidden" />}>
        <CheckoutHandler onConfirm={confirmCheckout} />
      </Suspense>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background-alt rounded-xl p-6"
        >
          <h2 className="text-2xl font-display font-semibold mb-6">
            Perfil
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Nome da Loja</label>
              <Input
                value={formData.nomeLoja}
                onChange={(e) =>
                  setFormData({ ...formData, nomeLoja: e.target.value })
                }
                placeholder="Nome da sua loja"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Username</label>
              <Input
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  setUsernameError("");
                }}
                placeholder="username"
              />
              {usernameError && (
                <p className="text-sm text-red-500 mt-1">{usernameError}</p>
              )}
              <p className="text-sm text-foreground/60 mt-1">
                Seu link: <span className="text-primary font-medium">/{formData.username || "username"}</span>
              </p>
              {formData.username && (
                <Link
                  href={`/${formData.username}`}
                  target="_blank"
                  className="text-primary hover:underline text-sm mt-2 inline-block"
                >
                  Ver perfil público →
                </Link>
              )}
            </div>
            <div>
              <label className="block mb-2 font-medium">WhatsApp</label>
              <Input
                value={formData.whatsappNumber}
                onChange={(e) =>
                  setFormData({ ...formData, whatsappNumber: e.target.value })
                }
                placeholder="11987654321"
              />
           