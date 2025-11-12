import { NextRequest, NextResponse } from "next/server";
import { createProduto, getCatalogo } from "@/lib/supabase/database";
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
    const { catalogoId, nome, slug, descricao, preco, imagem_url, link_externo, visivel } = body;

    console.log("📝 [API /api/produtos/create] Recebido:", { userId, catalogoId, nome, slug });

    if (!catalogoId || !nome || !slug) {
      return NextResponse.json({ error: "Catálogo ID, nome e slug são obrigatórios" }, { status: 400 });
    }

    // Verificar se o catálogo pertence ao usuário
    const catalogo = await getCatalogo(userId, catalogoId);
    if (!catalogo) {
      return NextResponse.json({ error: "Catálogo não encontrado" }, { status: 404 });
    }

    const produtoId = await createProduto(catalogoId, {
      nome,
      slug,
      descricao: descricao || null,
      preco: preco ? parseFloat(preco) : null,
      imagem_url: imagem_url || null,
      link_externo: link_externo || null,
      visivel: visivel !== undefined ? Boolean(visivel) : true,
    });

    console.log("✅ [API /api/produtos/create] Produto criado com ID:", produtoId);

    return NextResponse.json({ id: produtoId, message: "Produto criado com sucesso" });
  } catch (error: any) {
    console.error("❌ [API /api/produtos/create] Erro:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar produto" }, { status: 500 });
  }
}

