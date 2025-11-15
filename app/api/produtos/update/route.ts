import { NextRequest, NextResponse } from "next/server";
import { updateProduto, getCatalogo, getProduto } from "@/lib/supabase/database";
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

    const body = await request.json();
    const { catalogoId, id, nome, slug, descricao, preco, imagem_url, imagens_urls, visivel } = body;

    console.log("📝 [API /api/produtos/update] Recebido:", { userId, catalogoId, id, nome, slug });

    if (!catalogoId || !id || !nome || !slug) {
      return NextResponse.json({ error: "Catálogo ID, produto ID, nome e slug são obrigatórios" }, { status: 400 });
    }

    // Verificar se o catálogo pertence ao usuário
    const catalogo = await getCatalogo(userId, catalogoId);
    if (!catalogo) {
      return NextResponse.json({ error: "Catálogo não encontrado" }, { status: 404 });
    }

    // Buscar produto atual para obter imagens antigas
    const produtoAtual = await getProduto(catalogoId, id);
    const imagensAntigas: string[] = [];
    if (produtoAtual) {
      const imagens = (produtoAtual.imagens_urls && Array.isArray(produtoAtual.imagens_urls) && produtoAtual.imagens_urls.length > 0)
        ? produtoAtual.imagens_urls
        : (produtoAtual.imagem_url ? [produtoAtual.imagem_url] : []);
      imagensAntigas.push(...imagens);
    }

    // Processar imagens: usar imagens_urls se fornecido, senão usar imagem_url
    const updateData: any = {
      nome,
      slug,
      descricao: descricao || null,
      preco: preco ? parseFloat(preco) : null,
      link_externo: null, // Sempre null - funcionalidade removida
      visivel: visivel !== undefined ? Boolean(visivel) : true,
    };

    let novasImagensUrls: string[] = [];
    if (imagens_urls !== undefined) {
      novasImagensUrls = Array.isArray(imagens_urls) 
        ? imagens_urls.slice(0, 3) // Limitar a 3 imagens
        : [];
      updateData.imagens_urls = novasImagensUrls;
      updateData.imagem_url = novasImagensUrls[0] || null; // Primeira imagem para compatibilidade
    } else if (imagem_url !== undefined) {
      novasImagensUrls = imagem_url ? [imagem_url] : [];
      updateData.imagem_url = imagem_url || null;
      updateData.imagens_urls = novasImagensUrls;
    }

    // Deletar imagens antigas que não estão mais na lista
    if (imagensAntigas.length > 0 && supabaseAdmin) {
      const imagensParaDeletar = imagensAntigas.filter(img => !novasImagensUrls.includes(img));
      for (const imagemUrl of imagensParaDeletar) {
        if (imagemUrl) {
          try {
            // Extrair path da URL
            const urlObj = new URL(imagemUrl);
            const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/produtos\/(.+)/);
            if (pathMatch) {
              const imagePath = pathMatch[1];
              const { error: deleteError } = await supabaseAdmin.storage
                .from("produtos")
                .remove([imagePath]);
              if (deleteError) {
                console.warn("⚠️ [API /api/produtos/update] Erro ao deletar imagem:", imagePath, deleteError);
              } else {
                console.log("✅ [API /api/produtos/update] Imagem deletada:", imagePath);
              }
            }
          } catch (error) {
            console.warn("⚠️ [API /api/produtos/update] Erro ao processar URL da imagem:", imagemUrl, error);
          }
        }
      }
    }

    await updateProduto(catalogoId, id, updateData);

    console.log("✅ [API /api/produtos/update] Produto atualizado com sucesso");

    return NextResponse.json({ message: "Produto atualizado com sucesso" });
  } catch (error: any) {
    console.error("❌ [API /api/produtos/update] Erro:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar produto" }, { status: 500 });
  }
}

