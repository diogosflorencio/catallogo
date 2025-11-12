"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getCatalogo,
  getProdutos,
} from "@/lib/supabase/database";
import { UserProfile, Catalogo, Produto } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";

export default function ProdutosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [catalogoId, setCatalogoId] = useState<string>("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function loadParams() {
      const resolved = await params;
      setCatalogoId(resolved.id);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    // Exigir login
    if (!loading && !user) {
      router.push("/perfil");
      return;
    }
    if (user && catalogoId) {
      loadData();
    }
  }, [user, loading, router, catalogoId]);

  async function loadData() {
    if (!user || !catalogoId) return;
    
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
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
    const cat = await getCatalogo(user.uid, catalogoId);
    if (cat) {
      setCatalogo(cat);
      const prods = await getProdutos(catalogoId);
      setProdutos(prods);
    }
  }

  async function handleDelete(produtoId: string) {
    if (!user || !catalogoId || !confirm("Tem certeza que deseja excluir este produto?")) {
      return;
    }
    setDeleting(produtoId);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/produtos/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          catalogoId,
          id: produtoId,
        }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const errorData = await response.json();
        console.error("Erro ao deletar produto:", errorData);
        alert(`Erro ao deletar produto: ${errorData.error || "Erro desconhecido"}`);
      }
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      alert(`Erro ao deletar produto: ${error.message || "Erro desconhecido"}`);
    } finally {
      setDeleting(null);
    }
  }

  // Permitir acesso mesmo sem login
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lavender">Carregando...</div>
      </div>
    );
  }

  if (!user || !profile || !catalogo) {
    return null; // Será redirecionado pelo useEffect
  }

  return (
    <DashboardLayout profile={profile}>
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display font-semibold mb-2">
              Produtos - {catalogo.nome}
            </h2>
            <p className="text-foreground/70">
              {produtos.length} produto{produtos.length !== 1 ? "s" : ""} neste catálogo
              {profile.plano === "free" && ` (limite: 3 por catálogo)`}
            </p>
          </div>
          <Link href={`/dashboard/catalogos/${catalogoId}/produtos/novo`}>
            <Button
              disabled={profile.plano === "free" && produtos.length >= 3}
              title={profile.plano === "free" && produtos.length >= 3 ? "Limite de 3 produtos atingido no plano free" : ""}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </Link>
        </div>

        {produtos.length === 0 ? (
          <div className="bg-background-alt rounded-xl p-12 text-center">
            <p className="text-foreground/60 mb-4">
              Você ainda não tem produtos neste catálogo
            </p>
            <Link href={`/dashboard/catalogos/${catalogoId}/produtos/novo`}>
              <Button>Adicionar primeiro produto</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtos.map((produto, index) => (
              <motion.div
                key={produto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-background-alt rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {produto.imagem_url && (
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={produto.imagem_url}
                      alt={produto.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="font-display font-semibold text-lg mb-2">
                    {produto.nome}
                  </h3>
                  {produto.descricao && (
                    <p className="text-sm text-foreground/60 mb-2 line-clamp-2">
                      {produto.descricao}
                    </p>
                  )}
                  {produto.preco && (
                    <p className="font-semibold text-primary mb-4">
                      {formatPrice(Number(produto.preco))}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/catalogos/${catalogoId}/produtos/${produto.id}/editar`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(produto.id)}
                      disabled={deleting === produto.id}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleting === produto.id ? "Excluindo..." : "Excluir"}
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

