import { NextRequest, NextResponse } from "next/server";
import { getCatalogo } from "@/lib/supabase/database";
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

    const { id } = await params;

    // Buscar catálogo específico do usuário (público ou privado)
    // Usa supabaseAdmin no servidor, então retorna o catálogo se pertencer ao usuário
    const catalogo = await getCatalogo(userId, id);

    if (!catalogo) {
      return NextResponse.json({ error: "Catálogo não encontrado" }, { status: 404 });
    }

    return NextResponse.json(catalogo);
  } catch (error: any) {
    console.error("Erro ao buscar catálogo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

