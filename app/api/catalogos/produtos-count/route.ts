import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase/admin";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { catalogoIds } = body;

    if (!Array.isArray(catalogoIds)) {
      return NextResponse.json({ error: "catalogoIds deve ser um array" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase Admin não configurado" }, { status: 500 });
    }

    // Buscar contagem de produtos para cada catálogo
    const { data, error } = await supabaseAdmin
      .from("produtos")
      .select("catalogo_id")
      .in("catalogo_id", catalogoIds);

    if (error) {
      console.error("Erro ao buscar contagem de produtos:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Contar produtos por catálogo
    const counts: Record<string, number> = {};
    catalogoIds.forEach((id: string) => {
      counts[id] = 0;
    });
    
    if (data) {
      data.forEach((produto) => {
        counts[produto.catalogo_id] = (counts[produto.catalogo_id] || 0) + 1;
      });
    }

    return NextResponse.json(counts);
  } catch (error: any) {
    console.error("Erro na API de contagem de produtos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

