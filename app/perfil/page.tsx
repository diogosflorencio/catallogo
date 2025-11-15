"use client";

import { Button } from "@/components/ui/Button";
import { signInWithGoogle } from "@/lib/firebase/auth-simple";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Chrome } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";

export default function PerfilPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

  // Se já estiver logado, o AuthProvider vai redirecionar automaticamente
  // Esta página só deve aparecer para usuários não logados

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // O popup vai abrir e quando fechar, o usuário estará logado
      // O AuthProvider vai detectar a mudança automaticamente
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      setErrorModal({ isOpen: true, message: `Erro: ${error.message || error.code || "Erro desconhecido"}` });
    }
  };

  // Se já estiver logado, redirecionar IMEDIATAMENTE - SEM DELAY
  useEffect(() => {
    console.log("🔍 [PerfilPage] useEffect executado");
    console.log("🔍 [PerfilPage] user:", user ? user.email : "null");
    console.log("🔍 [PerfilPage] loading:", loading);
    
    if (user && !loading) {
      console.log("🔴 [PerfilPage] ========== USUÁRIO LOGADO DETECTADO ==========");
      console.log("🔴 [PerfilPage] Email:", user.email);
      console.log("🔴 [PerfilPage] UID:", user.uid);
      console.log("🔴 [PerfilPage] FORÇANDO REDIRECIONAMENTO IMEDIATO");
      
      // Redirecionar IMEDIATAMENTE para /um-pouco-sobre-voce
      // A página de destino vai verificar se o perfil está completo
      console.log("🔴 [PerfilPage] Redirecionando para /um-pouco-sobre-voce...");
      window.location.href = "/um-pouco-sobre-voce";
    } else if (!user && !loading) {
      console.log("ℹ️ [PerfilPage] Usuário não logado - mostrando página de login");
    }
  }, [user, loading]);

  // Se já estiver logado, mostrar mensagem de redirecionamento
  if (user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lavender mb-4">Redirecionando...</div>
          <p className="text-sm text-foreground/60">Você será redirecionado em instantes</p>
        </div>
      </div>
    );
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
        <div className="bg-background-alt rounded-2xl p-8 shadow-lg border border-blush/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-semibold mb-2">
              Bem-vindo ao Catallogo
            </h1>
            <p className="text-foreground/70">
              Crie sua conta ou faça login para começar
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                console.log("🟢 [PerfilPage] BOTÃO CLICADO - Iniciando login...");
                handleGoogleSignIn();
              }}
              className="w-full flex items-center justify-center gap-3 h-14 text-base bg-primary text-foreground hover:bg-primary/90 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:pointer-events-none"
            >
              <Chrome className="w-5 h-5" />
              Continuar com Google
            </button>

            <p className="text-xs text-center text-foreground/60 mt-6">
              Ao continuar, você concorda com nossos{" "}
              <Link href="/termos-de-servico" className="text-primary hover:underline">
                Termos de Serviço
              </Link>
              {" "}e{" "}
              <Link href="/politica-de-privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-blush/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary mb-1">∞</p>
                <p className="text-xs text-foreground/60">Ilimitado</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary mb-1">100%</p>
                <p className="text-xs text-foreground/60">Grátis</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary mb-1">🔗</p>
                <p className="text-xs text-foreground/60">URL Própria</p>
              </div>
            </div>
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

