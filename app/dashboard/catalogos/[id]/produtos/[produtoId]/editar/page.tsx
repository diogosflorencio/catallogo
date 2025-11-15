"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { uploadImage, uploadImages, deleteImage } from "@/lib/storage/upload";
import { UserProfile, Catalogo, Produto } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Loading } from "@/components/ui/Loading";
import { Modal } from "@/components/ui/Modal";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, X } from "lucide-react";

export default function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string; produtoId: string }>;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [catalogoId, setCatalogoId] = useState<string>("");
  const [produtoId, setProdutoId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nome: "",
    slug: "",
    descricao: "",
    preco: "",
    imagensUrls: [] as string[],
    linkExterno: "",
    visivel: true,
  });
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

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
    if (!authLoading && !user) {
      router.push("/perfil");
      return;
    }
    if (user && catalogoId && produtoId) {
      loadData();
    }
  }, [user, authLoading, router, catalogoId, produtoId]);

  async function loadData() {
    if (!user || !catalogoId || !produtoId) return;
    
    setLoading(true);
    try {
      const token = await user.getIdToken();
      
      // Buscar perfil, catálogo e produto em paralelo
      const [profileResponse, catalogoResponse, produtoResponse] = await Promise.all([
        fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/catalogos/${catalogoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/catalogos/${catalogoId}/produtos/${produtoId}`, {
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

      if (produtoResponse.ok) {
        const prod = await produtoResponse.json();
        setProduto(prod);
        
        // Processar imagens: usar imagens_urls se existir, senão usar imagem_url
        const imagensUrls = (prod.imagens_urls && Array.isArray(prod.imagens_urls) && prod.imagens_urls.length > 0)
          ? prod.imagens_urls
          : (prod.imagem_url ? [prod.imagem_url] : []);
        
        setFormData({
          nome: prod.nome,
          slug: prod.slug,
          descricao: prod.descricao || "",
          preco: prod.preco?.toString() || "",
          imagensUrls: imagensUrls,
          linkExterno: prod.link_externo || "",
          visivel: prod.visivel,
        });
        setPreviews(imagensUrls);
      } else if (produtoResponse.status === 404) {
        router.push(`/dashboard/catalogos/${catalogoId}/produtos`);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return;

    // Limitar a 3 imagens no total
    const remainingSlots = 3 - formData.imagensUrls.length;
    if (remainingSlots <= 0) {
      setErrorModal({
        isOpen: true,
        message: "Você pode adicionar no máximo 3 imagens por produto.",
      });
      return;
    }

    const filesToUpload = acceptedFiles.slice(0, remainingSlots);
    
    // Criar previews
    const newPreviews: string[] = [];
    filesToUpload.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === filesToUpload.length) {
          setPreviews([...previews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Upload
    setUploading(true);
    try {
      const token = await user.getIdToken();
      const urls = await uploadImages(filesToUpload, user.uid, token);
      setFormData({ 
        ...formData, 
        imagensUrls: [...formData.imagensUrls, ...urls]
      });
      setPreviews([...previews, ...newPreviews]);
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      setErrorModal({
        isOpen: true,
        message: error.message || "Erro ao fazer upload das imagens. Verifique se o bucket 'produtos' está configurado no Supabase.",
      });
    } finally {
      setUploading(false);
    }
  }, [user, formData, previews]);

  function removeImage(index: number) {
    const imageToRemove = formData.imagensUrls[index];
    const newUrls = formData.imagensUrls.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Deletar imagem do storage
    if (imageToRemove) {
      deleteImage(imageToRemove).catch((error) => {
        console.error("Erro ao deletar imagem:", error);
      });
    }
    
    setFormData({ ...formData, imagensUrls: newUrls });
    setPreviews(newPreviews);
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 3,
    multiple: true,
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
      setErrorModal({
        isOpen: true,
        message: "Você precisa fazer login para editar um produto",
      });
      return;
    }
    if (!catalogoId || !produtoId || !formData.nome.trim() || !formData.slug.trim()) {
      setErrorModal({
        isOpen: true,
        message: "Preencha todos os campos obrigatórios (nome do produto)",
      });
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
          imagens_urls: formData.imagensUrls, // Array de imagens
          link_externo: formData.linkExterno || null,
          visivel: formData.visivel,
        }),
      });

      if (response.ok) {
        router.push(`/dashboard/catalogos/${catalogoId}/produtos`);
      } else {
        const errorData = await response.json();
        console.error("Erro ao atualizar produto:", errorData);
        setErrorModal({
          isOpen: true,
          message: errorData.error || "Erro desconhecido ao atualizar produto",
        });
      }
    } catch (error: any) {
      console.error("Erro ao atualizar produto:", error);
      setErrorModal({
        isOpen: true,
        message: error.message || "Erro desconhecido ao atualizar produto",
      });
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <Loading message="Carregando produto..." fullScreen />;
  }

  if (!user) {
    return <Loading message="Redirecionando para login..." fullScreen />;
  }

  if (!profile || !catalogo || !produto) {
    return <Loading message="Carregando dados do produto..." fullScreen />;
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
          {/* Upload de Imagens (até 3) */}
          <div>
            <label className="block mb-2 font-medium">
              Imagens do Produto {formData.imagensUrls.length > 0 && `(${formData.imagensUrls.length}/3)`}
            </label>
            
            {/* Grid de imagens existentes */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-blush/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Área de upload */}
            {formData.imagensUrls.length < 3 && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/10"
                    : "border-blush/30 hover:border-primary"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 mx-auto mb-3 text-foreground/40" />
                {uploading ? (
                  <p className="text-foreground/60">Fazendo upload...</p>
                ) : (
                  <>
                    <p className="text-foreground/70 mb-1 text-sm">
                      {formData.imagensUrls.length === 0 
                        ? "Arraste imagens aqui ou clique para selecionar"
                        : `Adicionar mais imagens (${3 - formData.imagensUrls.length} restantes)`
                      }
                    </p>
                    <p className="text-xs text-foreground/50">
                      PNG, JPG, WEBP até 10MB cada • Máximo 3 imagens
                    </p>
                  </>
                )}
              </div>
            )}
            
            {formData.imagensUrls.length >= 3 && (
              <p className="text-sm text-foreground/60 mt-2">
                ✓ Máximo de 3 imagens atingido. Remova uma imagem para adicionar outra.
              </p>
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
      </motion.div>
    </DashboardLayout>
  );
}

