// Upload de imagens usando Supabase Storage

import { supabase } from "@/lib/supabase/client";

export async function uploadImage(
  file: File,
  path: string,
  token?: string
): Promise<string> {
  // Tentar upload via API route primeiro (mais seguro e confiável)
  if (token) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        const error = await response.json();
        console.warn("Upload via API falhou, tentando método direto:", error);
        // Continuar para método direto como fallback
      }
    } catch (error) {
      console.warn("Erro ao fazer upload via API, tentando método direto:", error);
      // Continuar para método direto como fallback
    }
  }

  // Fallback: upload direto (requer bucket público e políticas corretas)
  if (!supabase) {
    throw new Error("Supabase não está configurado. Configure as variáveis de ambiente no arquivo .env.local");
  }

  try {
    // Comprimir imagem no cliente antes do upload
    const compressedFile = await compressImage(file, 1200, 1200, 0.5, 0.75);
    
    // Upload para Supabase Storage (bucket público)
    const { data, error } = await supabase.storage
      .from("produtos")
      .upload(path, compressedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: compressedFile.type,
      });

    if (error) {
      // Mensagem de erro mais clara
      if (error.message.includes("Bucket not found") || error.message.includes("does not exist")) {
        throw new Error(
          "Bucket 'produtos' não encontrado no Supabase. " +
          "Vá em Supabase > Storage > Create bucket > Nome: 'produtos' > Público: Sim"
        );
      }
      throw error;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from("produtos")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error("Erro ao fazer upload da imagem:", error);
    throw error;
  }
}

export async function deleteImage(path: string): Promise<void> {
  if (!supabase) {
    console.warn("Supabase não está configurado. Não é possível deletar imagem.");
    return;
  }

  try {
    // Se for uma URL completa, extrair o path
    let imagePath = path;
    if (path.startsWith("http")) {
      // Extrair path da URL do Supabase Storage
      const urlObj = new URL(path);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/produtos\/(.+)/);
      if (pathMatch) {
        imagePath = pathMatch[1];
      } else {
        console.warn("Não foi possível extrair o path da URL:", path);
        return;
      }
    }

    // Deletar do Supabase Storage
    const { error } = await supabase.storage
      .from("produtos")
      .remove([imagePath]);

    if (error) {
      console.error("Erro ao deletar imagem:", error);
    }
  } catch (error) {
    console.error("Erro ao deletar imagem:", error);
    // Não lançar erro para não bloquear o fluxo
  }
}

// Comprimir imagem otimizada para reduzir tamanho mantendo qualidade
export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  maxSizeMB = 0.5, // Máximo 500KB
  quality = 0.75
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calcular dimensões mantendo proporção
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível criar contexto do canvas"));
          return;
        }

        // Melhorar qualidade de renderização
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Tentar comprimir até atingir o tamanho máximo desejado
        const compress = (currentQuality: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Erro ao comprimir imagem"));
                return;
              }

              const sizeMB = blob.size / (1024 * 1024);
              
              // Se o tamanho está OK ou qualidade já está muito baixa, aceitar
              if (sizeMB <= maxSizeMB || currentQuality <= 0.3) {
                // Converter para WebP se possível (melhor compressão)
                const finalType = file.type === "image/png" ? "image/png" : "image/jpeg";
                const finalFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + (finalType === "image/png" ? ".png" : ".jpg"), {
                  type: finalType,
                  lastModified: Date.now(),
                });
                resolve(finalFile);
              } else {
                // Reduzir qualidade e tentar novamente
                compress(Math.max(0.3, currentQuality - 0.1));
              }
            },
            file.type === "image/png" ? "image/png" : "image/jpeg",
            currentQuality
          );
        };

        compress(quality);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// Upload múltiplas imagens
export async function uploadImages(
  files: File[],
  userId: string,
  token?: string
): Promise<string[]> {
  const uploadPromises = files.map((file, index) => {
    const path = `produtos/${userId}/${Date.now()}_${index}_${file.name}`;
    return uploadImage(file, path, token);
  });
  
  return Promise.all(uploadPromises);
}
