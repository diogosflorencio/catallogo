"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserProfile, Catalogo, Produto } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowUpDown, ArrowUp, ArrowDown, Image as ImageIcon } from "lucide-react";
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
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

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

  function handleSortToggle() {
    if (sortOrder === null) {
      setSortOrder("asc");
    } else if (sortOrder === "asc") {
      setSortOrder("desc");
    } else {
      setSortOrder(null);
    }
  }

  // Ordenar produtos por preço
  const sortedProdutos = [...produtos].sort((a, b) => {
    if (sortOrder === null) return 0;
    
    const precoA = a.preco || 0;
    const precoB = b.preco || 0;
    
    if (sortOrder === "asc") {
      return precoA - precoB;
    } else {
      return precoB - precoA;
    }
  });

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
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-display font-semibold mb-1">
                {catalogo.nome}
              </h2>
              <p className="text-sm text-foreground/60">
                {produtos.length} de {profile.plano === "free" ? "3" : "∞"} produto{produtos.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {produtos.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleSortToggle}
                  className="w-full sm:w-auto"
                  title={sortOrder === null ? "Ordenar por preço" : sortOrder === "asc" ? "Preço: Menor para Maior" : "Preço: Maior para Menor"}
                >
                  {sortOrder === null ? (
                    <>
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Ordenar
                    </>
                  ) : sortOrder === "asc" ? (
                    <>
                      <ArrowUp className="w-4 h-4 mr-2" />
                      Menor → Maior
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Maior → Menor
                    </>
                  )}
                </Button>
              )}
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
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
            {sortedProdutos.map((produto, index) => {
              const imagens = (produto.imagens_urls && Array.isArray(produto.imagens_urls) && produto.imagens_urls.length > 0)
                ? produto.imagens_urls
                : (produto.imagem_url ? [produto.imagem_url] : []);
              
              const primeiraImagem = imagens[0] || null;
              const quantidadeImagens = imagens.length;
              
              return (
                <motion.div
                  key={produto.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-background-alt rounded-lg overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all duration-200 border border-foreground/5"
                >
                  {/* Imagem do produto - Apenas primeira imagem */}
                  {primeiraImagem && (
                    <div className="relative aspect-[4/3] overflow-hidden bg-foreground/5">
                      <img
                        src={primeiraImagem}
                        alt={produto.nome}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Badge de quantidade de imagens no canto superior direito */}
                      {quantidadeImagens > 1 && (
                        <div className="absolute top-1.5 right-1.5">
                          <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-black/60 text-white font-medium backdrop-blur-sm">
                            <ImageIcon className="w-2.5 h-2.5" />
                            {quantidadeImagens}
                          </span>
                        </div>
                      )}
                      
                      {/* Badge de status no canto superior esquerdo */}
                      <div className="absolute top-1.5 left-1.5">
                        {produto.visivel ? (
                          <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/90 text-white font-medium backdrop-blur-sm">
                            <Eye className="w-2.5 h-2.5" />
                            Visível
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-gray-500/90 text-white font-medium backdrop-blur-sm">
                            <EyeOff className="w-2.5 h-2.5" />
                            Oculto
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Conteúdo compacto */}
                  <div className="p-2">
                    <h3 className="font-display font-semibold text-xs mb-0.5 line-clamp-2 leading-tight">
                      {produto.nome}
                    </h3>
                    
                    {produto.descricao && (
                      <p className="text-[10px] text-foreground/50 mb-1.5 line-clamp-1">
                        {produto.descricao}
                      </p>
                    )}
                    
                    {produto.preco && (
                      <p className="font-bold text-primary mb-2 text-sm">
                        {formatPrice(Number(produto.preco))}
                      </p>
                    )}
                    
                    {/* Botões compactos */}
                    <div className="flex gap-1.5">
                      <Link
                        href={`/dashboard/catalogos/${catalogoId}/produtos/${produto.id}/editar`}
                        className="flex-1"
                      >
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full text-[10px] h-7 px-2"
                        >
                          <Edit className="w-2.5 h-2.5 mr-1" />
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(produto.id)}
                        disabled={deleting === produto.id}
                        className="flex-1 text-[10px] h-7 px-2"
                      >
                        <Trash2 className="w-2.5 h-2.5 mr-1" />
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