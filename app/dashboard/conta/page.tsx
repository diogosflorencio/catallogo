"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { checkUsernameExists } from "@/lib/supabase/database";
import { UserProfile } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PLANS, PlanType } from "@/lib/stripe/config";
import { stripePromise } from "@/lib/stripe/config";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import { signOut } from "@/lib/firebase/auth-simple";
import Link from "next/link";

export default function ContaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
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

  async function handleUpgrade(plan: PlanType) {
    if (!user) return;
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userId: user.uid }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      }
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
            </div>
            <div>
              <label className="block mb-2 font-medium">
                Template de Mensagem WhatsApp
              </label>
              <Textarea
                value={formData.mensagemTemplate}
                onChange={(e) =>
                  setFormData({ ...formData, mensagemTemplate: e.target.value })
                }
                placeholder="Olá! Vi o produto {{produtoNome}} no seu Catallogo 💖"
                rows={3}
              />
              <p className="text-sm text-foreground/60 mt-1">
                Use {"{{produtoNome}}"} para incluir o nome do produto
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </motion.div>

        {/* Tema e Aparência */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-background-alt rounded-xl p-6"
        >
          <h2 className="text-2xl font-display font-semibold mb-6">
            Tema e Aparência
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-medium">Tema do Site</label>
              <p className="text-sm text-foreground/60 mb-4">
                O tema atual é otimizado para uma experiência suave e feminina. 
                Personalizações de tema estarão disponíveis em breve.
              </p>
              <div className="flex gap-3">
                <div className="flex-1 p-4 rounded-lg border-2 border-primary bg-primary/10">
                  <p className="font-semibold mb-1">Tema Padrão</p>
                  <p className="text-xs text-foreground/60">Suave e feminino</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Planos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-background-alt rounded-xl p-6"
        >
          <h2 className="text-2xl font-display font-semibold mb-6">
            Planos e Assinatura
          </h2>
          <div className="mb-4">
            <p className="text-foreground/70">
              Plano atual: <span className="font-semibold capitalize">{profile.plano || 'free'}</span>
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(PLANS).map(([key, plan]) => {
              const isCurrent = profile.plano === key;
              const isUpgrade =
                (profile.plano === "free" && key !== "free") ||
                (profile.plano === "pro" && key === "premium");
              return (
                <div
                  key={key}
                  className={`rounded-xl p-6 border-2 ${
                    isCurrent
                      ? "border-primary bg-primary/10"
                      : "border-blush/30 bg-background"
                  }`}
                >
                  <h3 className="text-xl font-display font-semibold mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-3xl font-semibold mb-4">
                    {plan.price === 0 ? "Grátis" : formatPrice(plan.price)}
                    {plan.price > 0 && <span className="text-sm">/mês</span>}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="text-sm text-foreground/70">
                        ✓ {feature}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full">
                      Plano Atual
                    </Button>
                  ) : isUpgrade ? (
                    <Button
                      onClick={() => handleUpgrade(key as PlanType)}
                      className="w-full"
                    >
                      Assinar
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="w-full">
                      Downgrade
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Sair */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button variant="outline" onClick={handleSignOut}>
            Sair da Conta
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

