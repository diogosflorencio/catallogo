import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase/admin";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Verificar token do Firebase
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não fornecido" }, { status: 400 });
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Apenas imagens são permitidas" }, { status: 400 });
    }

    // Validar tamanho (máximo 10MB antes da compressão)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo muito grande (máximo 10MB)" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase não configurado" },
        { status: 500 }
      );
    }

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Gerar path único
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const path = `produtos/${userId}/${timestamp}_${sanitizedName}`;

    // Upload para Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("produtos")
      .upload(path, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error("Erro ao fazer upload:", error);
      
      // Se o bucket não existir, retornar erro específico
      if (error.message.includes("Bucket not found") || error.message.includes("does not exist")) {
        return NextResponse.json(
          { 
            error: "Bucket 'produtos' não encontrado. Configure o bucket no Supabase Storage.",
            details: "Vá em Supabase > Storage > Create bucket > Nome: 'produtos' > Público: Sim"
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Erro ao fazer upload" },
        { status: 500 }
      );
    }

    // Obter URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from("produtos")
      .getPublicUrl(data.path);

    return NextResponse.json({ url: urlData.publicUrl, path: data.path });
  } catch (error: any) {
    console.error("Erro ao processar upload:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar upload" },
      { status: 500 }
    );
  }
}

