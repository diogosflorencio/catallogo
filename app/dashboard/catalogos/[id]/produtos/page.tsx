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
import { Loading } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils";

export default function ProdutosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [catalogoId, setCatalogoId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; produtoId: string | null }>({ isOpen: false, produtoId: null });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

  useEffect(() => {
    async function loadParams() {
      const resolved = await params;
      setCatalogoId(resolved.id);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    // Exigir login
    if (!authLoading && !user) {
      router.push("/perfil");
      return;
    }
    if (user && catalogoId) {
      loadData();
    }
  }, [user, authLoading, router, catalogoId]);

  async function loadData() {
    if (!user || !catalogoId) return;
    
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const [profileResponse, catalogoResponse, produtosResponse] = await Promise.all([
        fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/catalogos/${catalogoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/catalogos/${catalogoId}/produtos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (profileResponse.ok) {
        const userProfile = await profileResponse.json();
        setProfile(userProfile);
      }

      if (catalogoResponse.ok) {
        const cat = await catalogoResponse.json();
        setCatalogo(cat);
      }

      if (produtosResponse.ok) {
        const prods = await produtosResponse.json();
        setProdutos(prods);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteClick(produtoId: string) {
    setDeleteModal({ isOpen: true, produtoId });
  }

  async function handleDeleteConfirm() {
    if (!user || !catalogoId || !deleteModal.produtoId) return;
    
    setDeleting(deleteModal.produtoId);
    setDeleteModal({ isOpen: false, produtoId: null });
    
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
          id: deleteModal.produtoId,
        }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const errorData = await response.json();
        console.error("Erro ao deletar produto:", errorData);
        setErrorModal({
          isOpen: true,
          message: errorData.error || "Erro desconhecido ao deletar produto",
        });
      }
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      setErrorModal({
        isOpen: true,
        message: error.message || "Erro desconhecido ao deletar produto",
      });
    } finally {
      setDeleting(null);
    }
  }

  if (authLoading || loading) {
    return <Loading message="Carregando produtos..." fullScreen />;
  }

  if (!user) {
    return <Loading message="Redirecionando para login..." fullScreen />;
  }

  if (!profile || !catalogo) {
    return <Loading message="Carregando dados..." fullScreen />;
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
                {(() => {
                  // Usar imagens_urls se existir, senão usar imagem_url
                  const imagens = (produto.imagens_urls && Array.isArray(produto.imagens_urls) && produto.imagens_urls.length > 0)
                    ? produto.imagens_urls
                    : (produto.imagem_url ? [produto.imagem_url] : []);
                  
                  return imagens.length > 0 ? (
                    <div className="aspect-square relative overflow-hidden">
                      {imagens.length === 1 ? (
                        <img
                          src={imagens[0]}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="grid grid-cols-2 h-full">
                          {imagens.slice(0, 4).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`${produto.nome} - Imagem ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-display font-semibold text-lg flex-1">
                      {produto.nome}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ml-2 flex-shrink-0 ${
                        produto.visivel
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {produto.visivel ? "✓ Visível" : "🔒 Oculto"}
                    </span>
                  </div>
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
                      onClick={() => handleDeleteClick(produto.id)}
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

        {/* Modal de confirmação de exclusão */}
        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, produtoId: null })}
          onConfirm={handleDeleteConfirm}
          title="Excluir Produto"
          message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
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
      </div>
    </DashboardLayout>
  );
}

