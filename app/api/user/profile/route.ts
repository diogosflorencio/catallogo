import { NextRequest, NextResponse } from "next/server";
import { getUserProfile } from "@/lib/supabase/database";
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

    const profile = await getUserProfile(userId);
    
    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

