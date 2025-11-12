"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { getCatalogos } from "@/lib/supabase/database";
import { UserProfile } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { canCreateCatalog } from "@/lib/firebase/plan-limits";
import { motion } from "framer-motion";

export default function NovoCatalogoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [catalogCount, setCatalogCount] = useState(0);
  const [formData, setFormData] = useState({
    nome: "",
    slug: "",
    descricao: "",
    public: true,
  });

  useEffect(() => {
    // Exigir login
    if (!loading && !user) {
      router.push("/perfil");
      return;
    }
    if (user) {
      loadProfile();
    }
  }, [user, loading, router]);

  async function loadProfile() {
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
        const catalogs = await getCatalogos(user.uid);
        setCatalogCount(catalogs.length);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
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
      alert("Você precisa fazer login para criar um catálogo");
      return;
    }
    if (!profile || !formData.nome.trim() || !formData.slug.trim()) {
      return;
    }

    // Verificar limite do plano
    if (!canCreateCatalog(profile, catalogCount)) {
      alert("Você atingiu o limite de catálogos do seu plano. Faça upgrade para criar mais.");
      return;
    }

    setSaving(true);
    try {
      console.log("📝 [novo-catalogo] Dados do formulário:", formData);
      
      const token = await user.getIdToken();
      const response = await fetch("/api/catalogos/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: formData.nome,
          slug: formData.slug,
          descricao: formData.descricao || null,
          public: formData.public,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ [novo-catalogo] Catálogo criado com ID:", result.id);
        router.push("/dashboard/catalogos");
      } else {
        const errorData = await response.json();
        console.error("❌ [novo-catalogo] Erro ao criar catálogo:", errorData);
        alert(`Erro ao criar catálogo: ${errorData.error || "Erro desconhecido"}`);
      }
    } catch (error: any) {
      console.error("❌ [novo-catalogo] Erro ao criar catálogo:", error);
      alert(`Erro ao criar catálogo: ${error.message || "Erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  }

  // Permitir acesso mesmo sem login (mas não pode criar)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lavender">Carregando...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/70 mb-4">Você precisa fazer login para criar um catálogo</p>
          <a href="/" className="text-primary hover:underline">Voltar para home</a>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout profile={profile}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="text-3xl font-display font-semibold mb-8">
          Novo Catálogo
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
            <label className="block mb-2 font-medium">Slug (URL)</label>
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
              {saving ? "Criando..." : "Criar Catálogo"}
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
}

