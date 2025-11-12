import { NextRequest, NextResponse } from "next/server";
import { deleteCatalogo } from "@/lib/supabase/database";
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
    const { id } = body;

    console.log("📝 [API /api/catalogos/delete] Recebido:", { userId, id });

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    await deleteCatalogo(userId, id);

    console.log("✅ [API /api/catalogos/delete] Catálogo deletado com sucesso");

    return NextResponse.json({ message: "Catálogo deletado com sucesso" });
  } catch (error: any) {
    console.error("❌ [API /api/catalogos/delete] Erro:", error);
    return NextResponse.json({ error: error.message || "Erro ao deletar catálogo" }, { status: 500 });
  }
}

