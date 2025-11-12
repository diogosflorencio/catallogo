import { NextRequest, NextResponse } from "next/server";
import { setUsername, checkUsernameExists } from "@/lib/supabase/database";
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
    const { username } = body;

    console.log("📝 [API /api/user/username] Recebido:", { userId, username });

    if (!username) {
      return NextResponse.json({ error: "Username é obrigatório" }, { status: 400 });
    }

    // Verificar se já existe
    const exists = await checkUsernameExists(username.toLowerCase());
    if (exists) {
      return NextResponse.json({ error: "Username já está em uso" }, { status: 400 });
    }

    await setUsername(userId, username.toLowerCase());
    
    console.log("✅ [API /api/user/username] Username atualizado com sucesso");
    
    return NextResponse.json({ message: "Username atualizado" });
  } catch (error: any) {
    console.error("Erro ao atualizar username:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username é obrigatório" }, { status: 400 });
    }

    const exists = await checkUsernameExists(username.toLowerCase());
    return NextResponse.json({ exists });
  } catch (error: any) {
    console.error("Erro ao verificar username:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

