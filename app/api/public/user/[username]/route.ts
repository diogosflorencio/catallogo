import { NextRequest, NextResponse } from "next/server";
import { getUidByUsername, getCatalogos, getUserProfile } from "@/lib/supabase/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    // Buscar usuário pelo username
    const userId = await getUidByUsername(username);
    if (!userId) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Buscar perfil e catálogos públicos
    const user = await getUserProfile(userId);
    if (!user) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const catalogos = await getCatalogos(userId);

    return NextResponse.json({ user, catalogos });
  } catch (error: any) {
    console.error("Erro ao buscar perfil público:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

