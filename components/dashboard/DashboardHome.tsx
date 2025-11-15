"use client";

import { UserProfile, Catalogo } from "@/lib/supabase/database";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ExternalLink, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

interface DashboardHomeProps {
  catalogos: Catalogo[];
  profile: UserProfile | null;
}

export function DashboardHome({ catalogos, profile }: DashboardHomeProps) {
  const { user } = useAuth();
  const [produtosCount, setProdutosCount] = useState<Record<string, number>>({});
  const [baseUrl, setBaseUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    async function loadProdutosCount() {
      if (!user || catalogos.length === 0) return;
      
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/catalogos/produtos-count", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            catalogoIds: catalogos.map((c) => c.id),
          }),
        });

        if (response.ok) {
          const counts = await response.json();
          setProdutosCount(counts);
        }
      } catch (error) {
        console.error("Erro ao buscar contagem de produtos:", error);
      }
    }

    loadProdutosCount();
  }, [user, catalogos]);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2000);
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-display font-semibold mb-4">
          Bem-vindo ao Catallogo!
        </h2>
        <p className="text-foreground/70 mb-6">
          Faça login para começar a criar seus catálogos
        </p>
        <Link href="/">
          <Button>Fazer Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-display font-semibold mb-2">
          Bem-vindo, {profile.nome_loja || profile.username}!
        </h2>
        <p className="text-foreground/70">
          Gerencie seus catálogos e produtos aqui
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-background-alt rounded-xl p-6">
          <p className="text-sm text-foreground/60 mb-1">Total de Catálogos</p>
          <p className="text-3xl font-display font-semibold">
            {catalogos.length}
          </p>
        </div>
        <div className="bg-background-alt rounded-xl p-6">
          <p className="text-sm text-foreground/60 mb-1">Plano Atual</p>
          <p className="text-3xl font-display font-semibold capitalize">
            {profile.plano || 'free'}
          </p>
        </div>
      </div>

      {/* Seus Links */}
      {profile.username && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background-alt rounded-xl p-6 mb-8"
        >
          <h2 className="text-2xl font-display font-semibold mb-4">
            Seus Links
          </h2>
          <p className="text-sm text-foreground/60 mb-4">
            Copie clicando no ícone ao lado deles
          </p>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Link do perfil */}
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-blush/20">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/60 mb-1">Você pode compartilhar todos os seus catálogos:</p>
                <p className="text-sm font-mono text-foreground/80 break-all">
                  {baseUrl || 'carregando...'}/{profile.username}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(`${baseUrl}/${profile.username}`)}
                className="ml-3 p-2 hover:bg-background-alt rounded-lg transition-colors flex-shrink-0"
                title="Copiar link"
              >
                {copiedLink === `${baseUrl}/${profile.username}` ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-foreground/60" />
                )}
              </button>
            </div>

            {/* Links dos catálogos */}
            {catalogos.length > 0 && (
              <>
                <p className="text-xs text-foreground/60 mb-2">Ou catálogos específicos:</p>
                {catalogos.map((catalogo) => (
                  <div
                    key={catalogo.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-blush/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-foreground/80 break-all">
                        {baseUrl || 'carregando...'}/{profile.username}/{catalogo.slug}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`${baseUrl}/${profile.username}/${catalogo.slug}`)}
                      className="ml-3 p-2 hover:bg-background-alt rounded-lg transition-colors flex-shrink-0"
                      title="Copiar link"
                    >
                      {copiedLink === `${baseUrl}/${profile.username}/${catalogo.slug}` ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-foreground/60" />
                      )}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Catálogos */}
      <div className="mb-6">
        <h3 className="text-2xl font-display font-semibold">Meus Catálogos</h3>
        <p className="text-sm text-foreground/60 mt-1">
          Gerencie seus catálogos na página de Catálogos
        </p>
      </div>

      {catalogos.length === 0 ? (
        <div className="bg-background-alt rounded-xl p-12 text-center">
          <p className="text-foreground/60 mb-4">
            Você ainda não tem catálogos
          </p>
          <Link href="/dashboard/catalogos">
            <Button>Ver Catálogos</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogos.map((catalogo, index) => (
            <motion.div
              key={catalogo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-background-alt rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <h4 className="font-display font-semibold text-lg mb-2">
                {catalogo.nome}
              </h4>
              {catalogo.descricao && (
                <p className="text-sm text-foreground/60 mb-2 line-clamp-2">
                  {catalogo.descricao}
                </p>
              )}
              <p className="text-xs text-foreground/50 mb-4">
                {produtosCount[catalogo.id] || 0} produto{produtosCount[catalogo.id] !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-1 rounded font-medium ${
                    catalogo.public
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {catalogo.public ? "✓ Público" : "🔒 Privado"}
                </span>
                {catalogo.public && profile?.username ? (
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/${profile.username}/${catalogo.slug}`}
                      target="_blank"
                      className="text-primary hover:underline flex items-center gap-1 text-sm"
                    >
                      Ver Catálogo
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <Link
                      href={`/${profile.username}`}
                      target="_blank"
                      className="text-primary/70 hover:underline flex items-center gap-1 text-xs"
                    >
                      Ver Perfil
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <span className="text-xs text-foreground/50">
                    Não visível publicamente
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

