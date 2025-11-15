import { NextRequest, NextResponse } from "next/server";
import { getCatalogos } from "@/lib/supabase/database";
import { verifyIdToken } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    // Verificar token do Firebase
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    // Buscar todos os catálogos do usuário (públicos e privados)
    // Usa supabaseAdmin no servidor, então retorna todos os catálogos do usuário
    const catalogos = await getCatalogos(userId);

    return NextResponse.json(catalogos);
  } catch (error: any) {
    console.error("Erro ao buscar catálogos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

