"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { getCatalogos } from "@/lib/supabase/database";
import { UserProfile, Catalogo } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Plus, Edit, Trash2, ExternalLink, Package } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CatalogosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

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
      const token = await user.getIdToken();
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userProfile = await response.json();
        setProfile(userProfile);
        const cats = await getCatalogos(user.uid);
        setCatalogos(cats);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }

  async function handleDelete(catalogoId: string) {
    if (!user || !confirm("Tem certeza que deseja excluir este catálogo?")) {
      return;
    }
    setDeleting(catalogoId);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/catalogos/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: catalogoId,
        }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const errorData = await response.json();
        console.error("Erro ao deletar catálogo:", errorData);
        alert(`Erro ao deletar catálogo: ${errorData.error || "Erro desconhecido"}`);
      }
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      alert(`Erro ao deletar catálogo: ${error.message || "Erro desconhecido"}`);
    } finally {
      setDeleting(null);
    }
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
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-semibold mb-2">
              Meus Catálogos
            </h2>
            <p className="text-foreground/70">
              Gerencie seus catálogos de produtos
            </p>
          </div>
          <Link href="/dashboard/catalogos/novo">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Catálogo
            </Button>
          </Link>
        </div>

        {catalogos.length === 0 ? (
          <div className="bg-background-alt rounded-xl p-12 text-center">
            <p className="text-foreground/60 mb-4">
              Você ainda não tem catálogos
            </p>
            <Link href="/dashboard/catalogos/novo">
              <Button>Criar primeiro catálogo</Button>
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
                <h3 className="font-display font-semibold text-lg mb-2">
                  {catalogo.nome}
                </h3>
                {catalogo.descricao && (
                  <p className="text-sm text-foreground/60 mb-4 line-clamp-2">
                    {catalogo.descricao}
                  </p>
                )}
                <div className="flex items-center justify-between mb-4">
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
                        className="text-primary hover:underline flex items-center gap-1 text-xs"
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
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/dashboard/catalogos/${catalogo.id}/produtos`}
                    className="w-full"
                  >
                    <Button className="w-full">
                      <Package className="w-4 h-4 mr-2" />
                      Gerenciar Produtos
                    </Button>
                  </Link>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/catalogos/${catalogo.id}/editar`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(catalogo.id)}
                      disabled={deleting === catalogo.id}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleting === catalogo.id ? "Excluindo..." : "Excluir"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

