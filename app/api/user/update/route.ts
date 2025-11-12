import { NextRequest, NextResponse } from "next/server";
import { updateUserProfile } from "@/lib/supabase/database";
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
    const { data } = body;

    console.log("📝 [API /api/user/update] Recebido:", { userId, data });

    await updateUserProfile(userId, data);
    
    console.log("✅ [API /api/user/update] Perfil atualizado com sucesso");
    
    return NextResponse.json({ message: "Perfil atualizado" });
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

