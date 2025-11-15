"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserProfile, Catalogo } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Loading } from "@/components/ui/Loading";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";

export default function EditarCatalogoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [catalogoId, setCatalogoId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    slug: "",
    descricao: "",
    public: true,
  });
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
      
      // Buscar perfil e catálogo em paralelo
      const [profileResponse, catalogoResponse] = await Promise.all([
        fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`/api/catalogos/${catalogoId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (profileResponse.ok) {
        const userProfile = await profileResponse.json();
        setProfile(userProfile);
      }

      if (catalogoResponse.ok) {
        const cat = await catalogoResponse.json();
        setCatalogo(cat);
        setFormData({
          nome: cat.nome,
          slug: cat.slug,
          descricao: cat.descricao || "",
          public: cat.public !== undefined ? cat.public : true,
        });
      } else if (catalogoResponse.status === 404) {
        router.push("/dashboard/catalogos");
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function handleNomeChange(value: string) {
    setFormData({
      ...formData,
      nome: value,
      slug: generateSlug(value),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setErrorModal({ isOpen: true, message: "Você precisa fazer login para editar um catálogo" });
      return;
    }
    if (!catalogoId || !formData.nome.trim() || !formData.slug.trim()) {
      return;
    }

    setSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/catalogos/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: catalogoId,
          nome: formData.nome,
          slug: formData.slug,
          descricao: formData.descricao || null,
          public: formData.public,
        }),
      });

      if (response.ok) {
        router.push("/dashboard/catalogos");
      } else {
        const errorData = await response.json();
        console.error("Erro ao atualizar catálogo:", errorData);
        setErrorModal({ isOpen: true, message: `Erro ao atualizar catálogo: ${errorData.error || "Erro desconhecido"}` });
      }
    } catch (error: any) {
      console.error("Erro ao atualizar catálogo:", error);
      setErrorModal({ isOpen: true, message: `Erro ao atualizar catálogo: ${error.message || "Erro desconhecido"}` });
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <Loading message="Carregando catálogo..." fullScreen />;
  }

  if (!user) {
    return <Loading message="Redirecionando para login..." fullScreen />;
  }

  if (!profile || !catalogo) {
    return <Loading message="Carregando dados do catálogo..." fullScreen />;
  }

  return (
    <DashboardLayout profile={profile}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="text-3xl font-display font-semibold mb-8">
          Editar Catálogo
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium">Nome do Catálogo</label>
            <Input
              value={formData.nome}
              onChange={(e) => handleNomeChange(e.target.value)}
              placeholder="Ex: Produtos de Verão"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">URL do Catálogo</label>
            <Input
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: generateSlug(e.target.value) })
              }
              placeholder="produtos-de-verao"
              required
            />
            <p className="text-sm text-foreground/60 mt-1">
              catallogo.web.app/{profile.username}/{formData.slug || "slug"}
            </p>
          </div>

          <div>
            <label className="block mb-2 font-medium">Descrição (opcional)</label>
            <Textarea
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Descreva seu catálogo..."
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="public"
              checked={formData.public}
              onChange={(e) =>
                setFormData({ ...formData, public: e.target.checked })
              }
              className="w-4 h-4 rounded border-blush/30"
            />
            <label htmlFor="public" className="text-sm">
              Catálogo público (visível para todos)
            </label>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
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
    </DashboardLayout>
  );
}

