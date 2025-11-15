import { NextRequest, NextResponse } from "next/server";
import { getPublicCatalogo } from "@/lib/supabase/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; catalogSlug: string }> }
) {
  try {
    const { username, catalogSlug } = await params;
    
    const data = await getPublicCatalogo(username, catalogSlug);
    
    if (!data) {
      return NextResponse.json({ error: "Catálogo não encontrado" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro ao buscar catálogo público:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

