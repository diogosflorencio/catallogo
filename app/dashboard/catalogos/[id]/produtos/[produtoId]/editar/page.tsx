"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getCatalogo,
  getProduto,
} from "@/lib/supabase/database";
import { uploadImage, deleteImage } from "@/lib/storage/upload";
import { UserProfile, Catalogo, Produto } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, X } from "lucide-react";

export default function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string; produtoId: string }>;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [catalogoId, setCatalogoId] = useState<string>("");
  const [produtoId, setProdutoId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    slug: "",
    descricao: "",
    preco: "",
    imagemUrl: null as string | null,
    linkExterno: "",
    visivel: true,
  });

  useEffect(() => {
    async function loadParams() {
      const resolved = await params;
      setCatalogoId(resolved.id);
      setProdutoId(resolved.produtoId);
    }
    loadParams();
  }, [params]);

  useEffect(() => {
    // Exigir login
    if (!loading && !user) {
      router.push("/perfil");
      return;
    }
    if (user && catalogoId && produtoId) {
      loadData();
    }
  }, [user, loading, router, catalogoId, produtoId]);

  async function loadData() {
    if (!user || !catalogoId || !produtoId) return;
    
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
    }
    const prod = await getProduto(catalogoId, produtoId);
    if (prod) {
      setProduto(prod);
      setFormData({
        nome: prod.nome,
        slug: prod.slug,
        descricao: prod.descricao || "",
        preco: prod.preco?.toString() || "",
        imagemUrl: prod.imagem_url || null,
        linkExterno: prod.link_externo || "",
        visivel: prod.visivel,
      });
      setPreview(prod.imagem_url || null);
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

      // Upload
      setUploading(true);
      try {
        const token = await user.getIdToken();
        
        // Deletar imagem antiga se existir
        if (formData.imagemUrl) {
          try {
            await deleteImage(formData.imagemUrl);
          } catch (error) {
            console.error("Erro ao deletar imagem antiga:", error);
          }
        }

        const path = `produtos/${user.uid}/${Date.now()}_${file.name}`;
        const url = await uploadImage(file, path, token);
        setFormData({ ...formData, imagemUrl: url });
      } catch (error: any) {
        console.error("Erro ao fazer upload:", error);
        alert(error.message || "Erro ao fazer upload da imagem. Verifique se o bucket 'produtos' está configurado no Supabase.");
      } finally {
        setUploading(false);
      }
  }, [user, formData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
  });

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
      alert("Você precisa fazer login para editar um produto");
      return;
    }
    if (!catalogoId || !produtoId || !formData.nome.trim() || !formData.slug.trim()) {
      return;
    }

    setSaving(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/produtos/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          catalogoId,
          id: produtoId,
          nome: formData.nome,
          slug: formData.slug,
          descricao: formData.descricao || null,
          preco: formData.preco || null,
          imagem_url: formData.imagemUrl,
          link_externo: formData.linkExterno || null,
          visivel: formData.visivel,
        }),
      });

      if (response.ok) {
        router.push(`/dashboard/catalogos/${catalogoId}/produtos`);
      } else {
        const errorData = await response.json();
        console.error("Erro ao atualizar produto:", errorData);
        alert(`Erro ao atualizar produto: ${errorData.error || "Erro desconhecido"}`);
      }
    } catch (error: any) {
      console.error("Erro ao atualizar produto:", error);
      alert(`Erro ao atualizar produto: ${error.message || "Erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lavender">Carregando...</div>
      </div>
    );
  }

  if (!user || !profile || !catalogo || !produto) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/70 mb-4">Você precisa fazer login para editar um produto</p>
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
          Editar Produto - {catalogo.nome}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload de Imagem */}
          <div>
            <label className="block mb-2 font-medium">Imagem do Produto</label>
            {preview || formData.imagemUrl ? (
              <div className="relative">
                <img
                  src={preview || formData.imagemUrl || ""}
                  alt="Preview"
                  className="w-full max-w-md h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setFormData({ ...formData, imagemUrl: null });
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/10"
                    : "border-blush/30 hover:border-primary"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-foreground/40" />
                {uploading ? (
                  <p className="text-foreground/60">Fazendo upload...</p>
                ) : (
                  <>
                    <p className="text-foreground/70 mb-2">
                      Arraste uma imagem aqui ou clique para selecionar
                    </p>
                    <p className="text-sm text-foreground/50">
                      PNG, JPG, WEBP até 10MB
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block mb-2 font-medium">Nome do Produto</label>
            <Input
              value={formData.nome}
              onChange={(e) => handleNomeChange(e.target.value)}
              placeholder="Ex: Vestido Floral"
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
              placeholder="vestido-floral"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Descrição (opcional)</label>
            <Textarea
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Descreva o produto..."
              rows={4}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Preço (opcional)</label>
            <Input
              type="number"
              step="0.01"
              value={formData.preco}
              onChange={(e) =>
                setFormData({ ...formData, preco: e.target.value })
              }
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Link Externo (opcional)</label>
            <Input
              type="url"
              value={formData.linkExterno}
              onChange={(e) =>
                setFormData({ ...formData, linkExterno: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="visivel"
              checked={formData.visivel}
              onChange={(e) =>
                setFormData({ ...formData, visivel: e.target.checked })
              }
              className="w-4 h-4 rounded border-blush/30"
            />
            <label htmlFor="visivel" className="text-sm">
              Produto visível no catálogo público
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
            <Button type="submit" disabled={saving || uploading} className="flex-1">
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </motion.div>
    </DashboardLayout>
  );
}

