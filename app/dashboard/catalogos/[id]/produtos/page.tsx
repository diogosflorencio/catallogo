"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserProfile, Catalogo, Produto } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
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
      <div className="pb-6">
        {/* Header compacto */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-display font-semibold mb-1">
              {catalogo.nome}
            </h2>
            <p className="text-sm text-foreground/60">
              {produtos.length} de {profile.plano === "free" ? "3" : "∞"} produto{produtos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href={`/dashboard/catalogos/${catalogoId}/produtos/novo`}>
            <Button
              disabled={profile.plano === "free" && produtos.length >= 3}
              title={profile.plano === "free" && produtos.length >= 3 ? "Limite de 3 produtos atingido no plano free" : ""}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        {produtos.length === 0 ? (
          <div className="bg-background-alt rounded-lg p-8 text-center">
            <p className="text-foreground/60 mb-4 text-sm">
              Você ainda não tem produtos neste catálogo
            </p>
            <Link href={`/dashboard/catalogos/${catalogoId}/produtos/novo`}>
              <Button size="sm">Adicionar primeiro produto</Button>
            </Link>
          </div>
        ) : (
          /* Grid de produtos - Mais compacto */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {produtos.map((produto, index) => {
              const imagens = (produto.imagens_urls && Array.isArray(produto.imagens_urls) && produto.imagens_urls.length > 0)
                ? produto.imagens_urls
                : (produto.imagem_url ? [produto.imagem_url] : []);
              
              return (
                <motion.div
                  key={produto.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-background-alt rounded-lg overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-foreground/5"
                >
                  {/* Imagem do produto - Compacta */}
                  {imagens.length > 0 && (
                    <div className="relative aspect-square overflow-hidden bg-foreground/5">
                      {imagens.length === 1 ? (
                        <img
                          src={imagens[0]}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="grid grid-cols-2 h-full gap-[1px]">
                          {imagens.slice(0, 4).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`${produto.nome} - ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Badge de status sobre a imagem */}
                      <div className="absolute top-2 right-2">
                        {produto.visivel ? (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-green-500/90 text-white font-medium backdrop-blur-sm">
                            <Eye className="w-3 h-3" />
                            Visível
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-gray-500/90 text-white font-medium backdrop-blur-sm">
                            <EyeOff className="w-3 h-3" />
                            Oculto
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Conteúdo compacto */}
                  <div className="p-3">
                    <h3 className="font-display font-semibold text-sm mb-1 line-clamp-2 leading-tight">
                      {produto.nome}
                    </h3>
                    
                    {produto.descricao && (
                      <p className="text-xs text-foreground/50 mb-2 line-clamp-1">
                        {produto.descricao}
                      </p>
                    )}
                    
                    {produto.preco && (
                      <p className="font-bold text-primary mb-3 text-base">
                        {formatPrice(Number(produto.preco))}
                      </p>
                    )}
                    
                    {/* Botões compactos */}
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/catalogos/${catalogoId}/produtos/${produto.id}/editar`}
                        className="flex-1"
                      >
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full text-xs h-8"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(produto.id)}
                        disabled={deleting === produto.id}
                        className="flex-1 text-xs h-8"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {deleting === produto.id ? "..." : "Excluir"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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