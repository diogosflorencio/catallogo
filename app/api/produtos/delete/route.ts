import { NextRequest, NextResponse } from "next/server";
import { deleteProduto, getCatalogo } from "@/lib/supabase/database";
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
    const { catalogoId, id } = body;

    console.log("📝 [API /api/produtos/delete] Recebido:", { userId, catalogoId, id });

    if (!catalogoId || !id) {
      return NextResponse.json({ error: "Catálogo ID e produto ID são obrigatórios" }, { status: 400 });
    }

    // Verificar se o catálogo pertence ao usuário
    const catalogo = await getCatalogo(userId, catalogoId);
    if (!catalogo) {
      return NextResponse.json({ error: "Catálogo não encontrado" }, { status: 404 });
    }

    await deleteProduto(catalogoId, id);

    console.log("✅ [API /api/produtos/delete] Produto deletado com sucesso");

    return NextResponse.json({ message: "Produto deletado com sucesso" });
  } catch (error: any) {
    console.error("❌ [API /api/produtos/delete] Erro:", error);
    return NextResponse.json({ error: error.message || "Erro ao deletar produto" }, { status: 500 });
  }
}

