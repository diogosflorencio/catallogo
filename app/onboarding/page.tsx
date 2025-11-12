"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { checkUsernameExists } from "@/lib/supabase/database";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nomeLoja: "",
    username: "",
    whatsappNumber: "",
  });
  const [usernameError, setUsernameError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Permitir acesso à página de onboarding mesmo sem login
    if (user) {
      checkOnboarding();
    }
  }, [user, loading, router]);

  async function checkOnboarding() {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profile = await response.json();
        if (profile && profile.username) {
          router.push(`/dashboard`);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar perfil:", error);
    }
  }

  async function handleNext() {
    if (step === 1) {
      if (!formData.nomeLoja.trim()) {
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.username.trim()) {
        return;
      }
      // Validar username
      const usernameRegex = /^[a-z0-9_-]+$/;
      if (!usernameRegex.test(formData.username.toLowerCase())) {
        setUsernameError("Username só pode conter letras, números, _ e -");
        return;
      }
      const exists = await checkUsernameExists(formData.username.toLowerCase());
      if (exists) {
        setUsernameError("Username já está em uso");
        return;
      }
      setUsernameError("");
      setStep(3);
    } else if (step === 3) {
      await handleFinish();
    }
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();

      // Definir username primeiro
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
        setStep(2);
        setUsernameError(errorData.error || "Erro ao salvar username");
        setSaving(false);
        return;
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
          },
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Erro ao atualizar perfil");
      }
      
      router.push(`/dashboard`);
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      if (error.message?.includes("Username")) {
        setStep(2);
        setUsernameError(error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lavender">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-background-alt rounded-2xl p-8 shadow-lg">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-semibold mb-2">
              Bem-vindo ao Catallogo!
            </h1>
            <p className="text-foreground/70">
              Vamos configurar seu perfil em 3 passos
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${
                  s <= step ? "bg-primary" : "bg-background"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Nome da Loja */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <label className="block mb-2 font-medium">
                Qual o nome da sua loja?
              </label>
              <Input
                value={formData.nomeLoja}
                onChange={(e) =>
                  setFormData({ ...formData, nomeLoja: e.target.value })
                }
                placeholder="Ex: Minha Loja"
                className="mb-4"
              />
            </motion.div>
          )}

          {/* Step 2: Username */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <label className="block mb-2 font-medium">
                Escolha seu username
              </label>
              <Input
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  setUsernameError("");
                }}
                placeholder="Ex: minhaloja"
                className="mb-2"
              />
              {usernameError && (
                <p className="text-sm text-red-500 mb-4">{usernameError}</p>
              )}
              <p className="text-sm text-foreground/60">
                Seu link será: catallogo.web.app/{formData.username || "username"}
              </p>
            </motion.div>
          )}

          {/* Step 3: WhatsApp */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <label className="block mb-2 font-medium">
                Número do WhatsApp
              </label>
              <Input
                value={formData.whatsappNumber}
                onChange={(e) =>
                  setFormData({ ...formData, whatsappNumber: e.target.value })
                }
                placeholder="Ex: 11987654321"
                className="mb-4"
              />
              <p className="text-sm text-foreground/60">
                Apenas números, sem espaços ou caracteres especiais
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                Voltar
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={saving}
              className="flex-1"
            >
              {step === 3 ? (saving ? "Salvando..." : "Finalizar") : "Próximo"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

