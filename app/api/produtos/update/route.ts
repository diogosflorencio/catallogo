import { NextRequest, NextResponse } from "next/server";
import { updateProduto, getCatalogo } from "@/lib/supabase/database";
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
    const { catalogoId, id, nome, slug, descricao, preco, imagem_url, link_externo, visivel } = body;

    console.log("📝 [API /api/produtos/update] Recebido:", { userId, catalogoId, id, nome, slug });

    if (!catalogoId || !id || !nome || !slug) {
      return NextResponse.json({ error: "Catálogo ID, produto ID, nome e slug são obrigatórios" }, { status: 400 });
    }

    // Verificar se o catálogo pertence ao usuário
    const catalogo = await getCatalogo(userId, catalogoId);
    if (!catalogo) {
      return NextResponse.json({ error: "Catálogo não encontrado" }, { status: 404 });
    }

    await updateProduto(catalogoId, id, {
      nome,
      slug,
      descricao: descricao || null,
      preco: preco ? parseFloat(preco) : null,
      imagem_url: imagem_url || null,
      link_externo: link_externo || null,
      visivel: visivel !== undefined ? Boolean(visivel) : true,
    });

    console.log("✅ [API /api/produtos/update] Produto atualizado com sucesso");

    return NextResponse.json({ message: "Produto atualizado com sucesso" });
  } catch (error: any) {
    console.error("❌ [API /api/produtos/update] Erro:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar produto" }, { status: 500 });
  }
}

