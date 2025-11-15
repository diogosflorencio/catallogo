"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { UserProfile, Catalogo } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { Plus, Edit, Trash2, ExternalLink, Package } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CatalogosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; catalogoId: string | null; catalogoNome: string }>({
    isOpen: false,
    catalogoId: null,
    catalogoNome: "",
  });
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: "",
  });
  const [produtosCount, setProdutosCount] = useState<Record<string, number>>({});

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

  async function loadData() {
    if (!user) return;
    
    setLoading(true);
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
        
        // Buscar catálogos via API route (retorna todos, públicos e privados)
        const catalogosResponse = await fetch("/api/catalogos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (catalogosResponse.ok) {
          const cats = await catalogosResponse.json();
          setCatalogos(cats);
          
          // Buscar contagem de produtos
          if (cats.length > 0) {
            const produtosCountResponse = await fetch("/api/catalogos/produtos-count", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                catalogoIds: cats.map((c: Catalogo) => c.id),
              }),
            });
            
            if (produtosCountResponse.ok) {
              const counts = await produtosCountResponse.json();
              setProdutosCount(counts);
            }
          }
        } else {
          console.error("Erro ao buscar catálogos:", await catalogosResponse.text());
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  function openDeleteModal(catalogoId: string, catalogoNome: string) {
    setDeleteModal({
      isOpen: true,
      catalogoId,
      catalogoNome,
    });
  }

  async function handleDelete() {
    if (!user || !deleteModal.catalogoId) return;
    
    setDeleting(deleteModal.catalogoId);
    setDeleteModal({ isOpen: false, catalogoId: null, catalogoNome: "" });
    
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/catalogos/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: deleteModal.catalogoId,
        }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const errorData = await response.json();
        console.error("Erro ao deletar catálogo:", errorData);
        setErrorModal({
          isOpen: true,
          message: errorData.error || "Erro desconhecido ao deletar catálogo",
        });
      }
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      setErrorModal({
        isOpen: true,
        message: error.message || "Erro desconhecido ao deletar catálogo",
      });
    } finally {
      setDeleting(null);
    }
  }

  if (authLoading || loading) {
    return <Loading message="Carregando catálogos..." fullScreen />;
  }

  if (!user) {
    return <Loading message="Redirecionando para login..." fullScreen />;
  }

  if (!profile) {
    return <Loading message="Carregando perfil..." fullScreen />;
  }

  return (
    <ThemeProvider userProfile={profile} isLandingPage={false}>
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
                  <p className="text-sm text-foreground/60 mb-2 line-clamp-2">
                    {catalogo.descricao}
                  </p>
                )}
                <p className="text-xs text-foreground/50 mb-4">
                  <Package className="w-3 h-3 inline mr-1" />
                  {produtosCount[catalogo.id] || 0} produto{produtosCount[catalogo.id] !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center justify-between mb-4">
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
                  ) : (
                    <span className="text-xs text-foreground/50">
                      Não visível publicamente
                    </span>
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
                      onClick={() => openDeleteModal(catalogo.id, catalogo.nome)}
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

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, catalogoId: null, catalogoNome: "" })}
        title="Excluir Catálogo"
        message={`Tem certeza que deseja excluir o catálogo "${deleteModal.catalogoNome}"?\n\nEsta ação não pode ser desfeita e todos os produtos deste catálogo serão excluídos.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDelete}
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
    </ThemeProvider>
  );
}

