import { NextRequest, NextResponse } from "next/server";
import { updateCatalogo } from "@/lib/supabase/database";
import { verifyIdToken } from "@/lib/firebase/admin";

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

    const body = await request.json();
    const { id, nome, slug, descricao, public: isPublic } = body;

    console.log("📝 [API /api/catalogos/update] Recebido:", { userId, id, nome, slug, descricao, public: isPublic });

    if (!id || !nome || !slug) {
      return NextResponse.json({ error: "ID, nome e slug são obrigatórios" }, { status: 400 });
    }

    await updateCatalogo(userId, id, {
      nome,
      slug,
      descricao: descricao || null,
      public: isPublic !== undefined ? Boolean(isPublic) : true,
    });

    console.log("✅ [API /api/catalogos/update] Catálogo atualizado com sucesso");

    return NextResponse.json({ message: "Catálogo atualizado com sucesso" });
  } catch (error: any) {
    console.error("❌ [API /api/catalogos/update] Erro:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar catálogo" }, { status: 500 });
  }
}

