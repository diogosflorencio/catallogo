import { NextRequest, NextResponse } from "next/server";
import { createCatalogo } from "@/lib/supabase/database";
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
    const { nome, slug, descricao, public: isPublic } = body;

    console.log("📝 [API /api/catalogos/create] Recebido:", { userId, nome, slug, descricao, public: isPublic });

    if (!nome || !slug) {
      return NextResponse.json({ error: "Nome e slug são obrigatórios" }, { status: 400 });
    }

    const catalogoId = await createCatalogo(userId, {
      nome,
      slug,
      descricao: descricao || null,
      public: isPublic !== undefined ? Boolean(isPublic) : true,
    });

    console.log("✅ [API /api/catalogos/create] Catálogo criado com ID:", catalogoId);

    return NextResponse.json({ id: catalogoId, message: "Catálogo criado com sucesso" });
  } catch (error: any) {
    console.error("❌ [API /api/catalogos/create] Erro:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar catálogo" }, { status: 500 });
  }
}

