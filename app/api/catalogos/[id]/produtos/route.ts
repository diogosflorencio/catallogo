import { NextRequest, NextResponse } from "next/server";
import { getProdutos } from "@/lib/supabase/database";
import { verifyIdToken } from "@/lib/firebase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: catalogoId } = await params;

    // Buscar produtos do catálogo
    const produtos = await getProdutos(catalogoId);

    return NextResponse.json(produtos);
  } catch (error: any) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

