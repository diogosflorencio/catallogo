import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, createUserProfile, updateUserProfile } from "@/lib/supabase/database";
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
    const { email, display_name, photo_url } = body;

    // Verificar se o usuário já existe
    const existingProfile = await getUserProfile(userId);

    if (!existingProfile) {
      // Criar novo perfil
      await createUserProfile(userId, {
        email: email || "",
        display_name: display_name || null,
        photo_url: photo_url || null,
      });
      return NextResponse.json({ message: "Perfil criado" });
    } else {
      // Atualizar perfil existente
      await updateUserProfile(userId, {
        email: email || existingProfile.email,
        display_name: display_name || existingProfile.display_name,
        photo_url: photo_url || existingProfile.photo_url,
        last_active_at: new Date().toISOString(),
      });
      return NextResponse.json({ message: "Perfil atualizado" });
    }
  } catch (error: any) {
    console.error("Erro ao sincronizar perfil:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

