"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { checkUsernameExists } from "@/lib/supabase/database";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loading } from "@/components/ui/Loading";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";

export default function UmPoucoSobreVocePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nomeLoja: "",
    username: "",
    whatsappNumber: "",
  });
  const [usernameError, setUsernameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

  useEffect(() => {
    // Se não estiver logado, redirecionar para /perfil
    if (!authLoading && !user) {
      window.location.href = "/perfil";
      return;
    }
    
    // Se já tiver perfil completo, redirecionar para dashboard
    if (user && !authLoading) {
      checkProfile();
    }
  }, [user, authLoading]);

  async function checkProfile() {
    if (!user) return;
    setCheckingProfile(true);
    try {
      // Buscar perfil via API route
      const token = await user.getIdToken();
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profile = await response.json();
        // Verificar se tem TODOS os dados necessários
        if (profile && profile.username && profile.nome_loja && profile.whatsapp_number) {
          // Perfil completo - redirecionar para dashboard
          console.log("✅ Perfil completo - redirecionando para /dashboard");
          window.location.href = "/dashboard";
          return;
        }
        // Se não tem todos os dados, carregar o que já existe
        if (profile) {
          setFormData({
            nomeLoja: profile.nome_loja || "",
            username: profile.username || "",
            whatsappNumber: profile.whatsapp_number || "",
          });
          // Se já tem algum dado, ajustar o step
          if (profile.nome_loja && !profile.username) {
            setStep(2);
          } else if (profile.nome_loja && profile.username && !profile.whatsapp_number) {
            setStep(3);
          }
        }
      } else {
        console.error("Erro ao buscar perfil:", await response.text());
      }
    } catch (error) {
      console.error("Erro ao verificar perfil:", error);
    } finally {
      setCheckingProfile(false);
    }
  }

  async function handleNext() {
    if (step === 1) {
      if (!formData.nomeLoja.trim()) {
        setErrorModal({ isOpen: true, message: "Por favor, informe o nome da sua loja" });
        return;
      }
      // Salvar nome da loja imediatamente
      if (user) {
        try {
          const nomeLoja = formData.nomeLoja.trim();
          console.log("💾 [um-pouco-sobre-voce] Salvando nome da loja:", nomeLoja);
          
          const token = await user.getIdToken();
          const response = await fetch("/api/user/update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              data: {
                nome_loja: nomeLoja,
              },
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log("✅ [um-pouco-sobre-voce] Nome da loja salvo:", nomeLoja, result);
          } else {
            const errorText = await response.text();
            console.error("❌ [um-pouco-sobre-voce] Erro ao salvar nome da loja:", errorText);
          }
        } catch (error) {
          console.error("❌ [um-pouco-sobre-voce] Erro ao salvar nome da loja:", error);
        }
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.username.trim()) {
        setErrorModal({ isOpen: true, message: "Por favor, escolha um username" });
        return;
      }
      // Validar username
      const usernameRegex = /^[a-z0-9_-]+$/;
      if (!usernameRegex.test(formData.username.toLowerCase())) {
        setUsernameError("Username só pode conter letras minúsculas, números, _ e -");
        return;
      }
      const exists = await checkUsernameExists(formData.username.toLowerCase());
      if (exists) {
        setUsernameError("Username já está em uso");
        return;
      }
      setUsernameError("");
      // Salvar username imediatamente
      if (user) {
        try {
          const username = formData.username.toLowerCase();
          console.log("💾 [um-pouco-sobre-voce] Salvando username:", username);
          
          const token = await user.getIdToken();
          const response = await fetch("/api/user/username", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              username: username,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log("✅ [um-pouco-sobre-voce] Username salvo:", username, result);
          } else {
            const errorData = await response.json();
            console.error("❌ [um-pouco-sobre-voce] Erro ao salvar username:", errorData);
            setUsernameError(errorData.error || "Erro ao salvar username. Tente novamente.");
            return;
          }
        } catch (error: any) {
          console.error("❌ [um-pouco-sobre-voce] Erro ao salvar username:", error);
          setUsernameError("Erro ao salvar username. Tente novamente.");
          return;
        }
      }
      setStep(3);
    } else if (step === 3) {
      await handleFinish();
    }
  }

  async function handleFinish() {
    if (!user) {
      setErrorModal({ isOpen: true, message: "Você precisa estar logado para continuar" });
      setTimeout(() => window.location.href = "/perfil", 2000);
      return;
    }
    
    if (!formData.whatsappNumber.trim()) {
      setErrorModal({ isOpen: true, message: "Por favor, informe seu número do WhatsApp" });
      return;
    }

    // Validar formato do WhatsApp (apenas números)
    const whatsappRegex = /^\d+$/;
    if (!whatsappRegex.test(formData.whatsappNumber.trim())) {
      setErrorModal({ isOpen: true, message: "O número do WhatsApp deve conter apenas números" });
      return;
    }

    setSaving(true);
    try {
      // Salvar WhatsApp
      const whatsappNumber = formData.whatsappNumber.trim();
      console.log("💾 [um-pouco-sobre-voce] Salvando WhatsApp:", whatsappNumber);
      
      const token = await user.getIdToken();
      const response = await fetch("/api/user/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            whatsapp_number: whatsappNumber,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ [um-pouco-sobre-voce] WhatsApp salvo:", whatsappNumber, result);
      } else {
        const errorText = await response.text();
        console.error("❌ [um-pouco-sobre-voce] Erro ao salvar WhatsApp:", errorText);
        throw new Error("Erro ao salvar WhatsApp");
      }
      
      // Aguardar um momento para garantir que foi salvo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirecionar para dashboard
      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      setErrorModal({ isOpen: true, message: "Erro ao salvar dados. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || checkingProfile) {
    return <Loading message="Verificando se você tem usuário..." fullScreen />;
  }

  if (!user) {
    return <Loading message="Redirecionando para login..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-background-alt rounded-2xl p-8 shadow-lg border border-blush/10">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-semibold mb-2">
              Um pouco sobre você
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
                className={`flex-1 h-2 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-blush/20"
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
                Qual o nome da sua loja? *
              </label>
              <Input
                value={formData.nomeLoja}
                onChange={(e) =>
                  setFormData({ ...formData, nomeLoja: e.target.value })
                }
                placeholder="Ex: Minha Loja"
                className="mb-4"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && formData.nomeLoja.trim()) {
                    handleNext();
                  }
                }}
              />
              <p className="text-sm text-foreground/60">
                Este nome aparecerá nos seus catálogos
              </p>
            </motion.div>
          )}

          {/* Step 2: Username */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <label className="block mb-2 font-medium">
                Escolha seu username *
              </label>
              <Input
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value.toLowerCase() });
                  setUsernameError("");
                }}
                placeholder="Ex: minhaloja"
                className="mb-2"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && formData.username.trim() && !usernameError) {
                    handleNext();
                  }
                }}
              />
              {usernameError && (
                <p className="text-sm text-red-500 mb-2">{usernameError}</p>
              )}
              <p className="text-sm text-foreground/60 mb-4">
                Seu link será: {typeof window !== "undefined" ? window.location.origin : ""}/{formData.username || "username"}
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
                Número do WhatsApp *
              </label>
              <Input
                value={formData.whatsappNumber}
                onChange={(e) =>
                  setFormData({ ...formData, whatsappNumber: e.target.value.replace(/\D/g, "") })
                }
                placeholder="Ex: 11987654321"
                className="mb-2"
                type="tel"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && formData.whatsappNumber.trim()) {
                    handleFinish();
                  }
                }}
              />
              <p className="text-sm text-foreground/60">
                Apenas números, sem espaços ou caracteres especiais. Este número será usado para clientes entrarem em contato.
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
                disabled={saving}
              >
                Voltar
              </Button>
            )}
            <Button
              onClick={step === 3 ? handleFinish : handleNext}
              disabled={saving || (step === 1 && !formData.nomeLoja.trim()) || (step === 2 && (!formData.username.trim() || !!usernameError)) || (step === 3 && !formData.whatsappNumber.trim())}
              className="flex-1"
            >
              {step === 3 ? (saving ? "Salvando..." : "Finalizar e ir para o Dashboard") : "Próximo"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Modal de erro */}
      <Modal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: "" })}
        title="Erro"
        message={errorModal.message}
        confirmText="OK"
        showCancel={false}
        variant="default"
      />
    </div>
  );
}

