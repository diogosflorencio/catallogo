"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { checkUsernameExists } from "@/lib/supabase/database";
import { UserProfile } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Loading } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PLANS, PlanType } from "@/lib/stripe/config";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import { signOut } from "@/lib/firebase/auth-simple";
import { uploadImage } from "@/lib/storage/upload";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import Link from "next/link";

function ContaPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkoutConfirmed, setCheckoutConfirmed] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nomeLoja: "",
    username: "",
    whatsappNumber: "",
    mensagemTemplate: "",
  });
  const [usernameError, setUsernameError] = useState("");
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: "" });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Exigir login
    if (!authLoading && !user) {
      router.push("/perfil");
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const success = searchParams.get("success");
    const sessionId = searchParams.get("session_id");

    if (
      user &&
      success === "true" &&
      sessionId &&
      !checkoutConfirmed
    ) {
      confirmCheckout(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user, checkoutConfirmed]);

  async function loadData() {
    if (!user) return;
    
    setLoading(true);
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
        setCustomPhotoUrl(userProfile.custom_photo_url || null);
        setPhotoPreview(userProfile.custom_photo_url || null);
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
    } finally {
      setLoading(false);
    }
  }

  const onDropPhoto = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploadingPhoto(true);
    try {
      const token = await user.getIdToken();
      const path = `perfis/${user.uid}/${Date.now()}_${file.name}`;
      const url = await uploadImage(file, path, token);
      setCustomPhotoUrl(url);
    } catch (error: any) {
      console.error("Erro ao fazer upload da foto:", error);
      setErrorModal({
        isOpen: true,
        message: error.message || "Erro ao fazer upload da foto. Verifique se o bucket está configurado.",
      });
    } finally {
      setUploadingPhoto(false);
    }
  }, [user]);

  const { getRootProps: getRootPropsPhoto, getInputProps: getInputPropsPhoto, isDragActive: isDragActivePhoto } = useDropzone({
    onDrop: onDropPhoto,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
  });

  function removePhoto() {
    setPhotoPreview(null);
    setCustomPhotoUrl(null);
  }

  async function handleSave() {
    if (!user) {
      setErrorModal({
        isOpen: true,
        message: "Você precisa fazer login para editar seu perfil",
      });
      return;
    }
    if (!profile) return;
    
    // Validar username antes de salvar
    if (formData.username !== profile.username) {
      if (!formData.username || formData.username.length < 3) {
        setUsernameError("Username deve ter pelo menos 3 caracteres");
        return;
      }
      
      if (!/^[a-z0-9_-]+$/.test(formData.username)) {
        setUsernameError("Username pode conter apenas letras minúsculas, números, hífen e underscore");
        return;
      }
      
      const exists = await checkUsernameExists(formData.username.toLowerCase());
      if (exists) {
        setUsernameError("Este username já está em uso. Por favor, escolha outro.");
        return;
      }
    }
    
    setSaving(true);
    try {
      const token = await user.getIdToken();

      // Se username mudou, atualizar
      if (formData.username !== profile.username) {
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

      // Atualizar outros campos (incluindo foto customizada)
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
            custom_photo_url: customPhotoUrl,
          },
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Erro ao atualizar perfil");
      }

      await loadData();
      setSuccessModal({
        isOpen: true,
        message: "Perfil atualizado com sucesso!",
      });
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      setErrorModal({
        isOpen: true,
        message: error.message || "Erro ao atualizar perfil. Tente novamente.",
      });
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

  if (authLoading || loading) {
    return <Loading message="Carregando configurações da conta..." fullScreen />;
  }

  if (!user) {
    return <Loading message="Redirecionando para login..." fullScreen />;
  }

  if (!profile) {
    return <Loading message="Carregando perfil..." fullScreen />;
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
              <div className="flex gap-2">
                <Input
                  value={formData.username}
                  onChange={async (e) => {
                    const newUsername = e.target.value.toLowerCase();
                    setFormData({ ...formData, username: newUsername });
                    setUsernameError("");
                    
                    // Validar username em tempo real se mudou do original
                    if (newUsername && newUsername !== profile?.username && newUsername.length >= 3) {
                      setCheckingUsername(true);
                      try {
                        const exists = await checkUsernameExists(newUsername);
                        if (exists) {
                          setUsernameError("Este username já está em uso");
                        }
                      } catch (error) {
                        console.error("Erro ao verificar username:", error);
                      } finally {
                        setCheckingUsername(false);
                      }
                    }
                  }}
                  placeholder="username"
                  className="flex-1"
                />
                {checkingUsername && (
                  <div className="flex items-center px-3">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {usernameError && (
                <p className="text-sm text-red-500 mt-1">{usernameError}</p>
              )}
              {!usernameError && formData.username && formData.username !== profile?.username && !checkingUsername && (
                <p className="text-sm text-green-600 mt-1">✓ Username disponível</p>
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
                Escolha entre o tema claro ou o tema escuro/feminino. O tema escuro usa preto, cinza, roxo e rosa para uma experiência elegante.
              </p>
              <div className="flex gap-3">
                <div className="flex-1 p-4 rounded-lg border-2 border-primary bg-primary/10">
                  <p className="font-semibold mb-1">Tema Claro</p>
                  <p className="text-xs text-foreground/60">Suave e feminino</p>
                </div>
                <div className="flex-1 p-4 rounded-lg border-2 border-lavender bg-lavender/10">
                  <p className="font-semibold mb-1">Tema Escuro/Feminino</p>
                  <p className="text-xs text-foreground/60">Preto, cinza, roxo e rosa</p>
                </div>
              </div>
              <div className="mt-4">
                <ThemeToggle />
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

        {/* Sair  */}
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

      {/* Modal de sucesso */}
      <Modal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, message: "" })}
        title="Sucesso"
        message={successModal.message}
        confirmText="OK"
        showCancel={false}
        variant="default"
      />

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
    </DashboardLayout>
  );
}

export default function ContaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lavender">Carregando...</div>
      </div>
    }>
      <ContaPageContent />
    </Suspense>
  );
}