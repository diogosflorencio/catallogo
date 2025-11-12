"use client";

import { UserProfile, Catalogo } from "@/lib/supabase/database";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardHomeProps {
  catalogos: Catalogo[];
  profile: UserProfile | null;
}

export function DashboardHome({ catalogos, profile }: DashboardHomeProps) {
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
      <div className="grid md:grid-cols-3 gap-4 mb-8">
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
        <div className="bg-background-alt rounded-xl p-6">
          <p className="text-sm text-foreground/60 mb-1">Seu Link</p>
          <p className="text-sm font-mono text-primary break-all">
            catallogo.web.app/{profile.username || 'seu-username'}
          </p>
        </div>
      </div>

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
                <p className="text-sm text-foreground/60 mb-4 line-clamp-2">
                  {catalogo.descricao}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    catalogo.public
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {catalogo.public ? "Público" : "Privado"}
                </span>
                {catalogo.public && profile?.username && (
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
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

