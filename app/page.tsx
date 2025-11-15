"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Link2, Infinity, Sparkles } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    // Redirecionar para configuração se usuário logado mas sem perfil completo
    if (user && !loading) {
      checkUserProfile();
    }
  }, [user, loading, router]);

  async function checkUserProfile() {
    if (!user) return;
    try {
      // Buscar perfil via API route
      const token = await user.getIdToken();
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const profile = response.ok ? await response.json() : null;
      if (profile && profile.username && profile.nome_loja && profile.whatsapp_number) {
        router.push("/dashboard");
      } else {
        router.push("/um-pouco-sobre-voce");
      }
    } catch (error) {
      console.error("Erro ao verificar perfil:", error);
    }
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      if (error.message?.includes("Firebase não está configurado")) {
        alert("Por favor, configure as variáveis de ambiente do Firebase no arquivo .env.local");
      } else {
        alert("Erro ao fazer login. Tente novamente.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lavender">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-blush/20 flex-shrink-0">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-display font-semibold text-foreground">
            Catallogo
          </h1>
          {!user && (
            <div className="flex gap-2">
              <Button 
                onClick={() => router.push("/perfil")} 
                variant="outline"
                className="h-9"
              >
                Entrar
              </Button>
              <Button 
                onClick={() => router.push("/perfil")}
                className="h-9"
              >
                Criar Conta
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Tudo visível sem scroll no desktop */}
      <main className="flex-1 flex items-center overflow-hidden min-h-0">
        <div className="container mx-auto px-4 py-4 w-full h-full flex flex-col justify-center">
          <div className="grid lg:grid-cols-2 gap-8 items-center max-w-7xl mx-auto">
            {/* Left Side - Hero */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                <span>Plano Grátis Ilimitado</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
                Crie seu catálogo com{" "}
                <span className="text-primary">URL personalizada</span>
              </h1>
              
              <p className="text-xl text-foreground/70 leading-relaxed">
                Compartilhe seus produtos com um link único e profissional. 
                <strong className="text-foreground"> Grátis para sempre</strong>, sem limites de tempo ou produtos.
              </p>

              {/* Features destacadas */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">URL Personalizada</p>
                    <p className="text-sm text-foreground/60">{baseUrl || 'catallogo.app'}/seu-nome</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Infinity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Ilimitado</p>
                    <p className="text-sm text-foreground/60">Catálogos e produtos</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              {!user && (
                <div className="pt-4">
                  <Button 
                    onClick={() => router.push("/perfil")} 
                    size="lg" 
                    className="text-lg px-8 py-6 h-auto"
                  >
                    Começar grátis agora
                  </Button>
                  <p className="text-sm text-foreground/60 mt-3">
                    ✓ Sem cartão de crédito • ✓ Sem tempo limite • ✓ Sem custos ocultos
                  </p>
                </div>
              )}
            </motion.div>

            {/* Right Side - Features Grid */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              {/* Feature Card 1 */}
              <div className="bg-background-alt rounded-2xl p-6 border border-blush/10 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-blush/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">🔗</span>
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">
                  Link Único
                </h3>
                <p className="text-sm text-foreground/70">
                  URL personalizada para compartilhar em qualquer lugar
                </p>
              </div>

              {/* Feature Card 2 */}
              <div className="bg-background-alt rounded-2xl p-6 border border-blush/10 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-peach/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">
                  WhatsApp
                </h3>
                <p className="text-sm text-foreground/70">
                  Clientes entram em contato direto pelo WhatsApp
                </p>
              </div>

              {/* Feature Card 3 */}
              <div className="bg-background-alt rounded-2xl p-6 border border-blush/10 hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-lavender/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">🛍️</span>
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">
                  Produtos Ilimitados
                </h3>
                <p className="text-sm text-foreground/70">
                  Adicione quantos produtos quiser, sem limites
                </p>
              </div>

              {/* Feature Card 4 - Destaque */}
              <div className="bg-gradient-to-br from-primary/10 to-blush/10 rounded-2xl p-6 border-2 border-primary/20">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-foreground">
                  Grátis Para Sempre
                </h3>
                <p className="text-sm text-foreground/70">
                  Plano gratuito ilimitado, sem tempo de expiração
                </p>
              </div>
            </motion.div>
          </div>

          {/* Bottom Section - Benefícios */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 pt-4 border-t border-blush/20"
          >
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto text-center">
              <div>
                <p className="text-2xl font-bold text-primary mb-1">∞</p>
                <p className="text-sm text-foreground/70">Catálogos Ilimitados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary mb-1">∞</p>
                <p className="text-sm text-foreground/70">Produtos Ilimitados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary mb-1">100%</p>
                <p className="text-sm text-foreground/70">Plano Gratuito para sempre</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-blush/20 py-4 flex-shrink-0">
        <div className="container mx-auto px-4 text-center text-foreground/60 text-sm">
          <p>© 2025 Catallogo. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
