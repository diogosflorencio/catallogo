import { NextRequest, NextResponse } from "next/server";
import { getProduto } from "@/lib/supabase/database";
import { verifyIdToken } from "@/lib/firebase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; produtoId: string }> }
) {
  try {
    // Verificar token do Firebase
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const { id: catalogoId, produtoId } = await params;

    // Buscar produto específico do catálogo do usuário
    const produto = await getProduto(catalogoId, produtoId);

    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    return NextResponse.json(produto);
  } catch (error: any) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

