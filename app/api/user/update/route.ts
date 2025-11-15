import { NextRequest, NextResponse } from "next/server";
import { updateUserProfile, getUserProfile } from "@/lib/supabase/database";
import { verifyIdToken } from "@/lib/firebase/admin";
import { supabaseAdmin } from "@/lib/supabase/server";

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

    console.log("📝 [API /api/user/update] Recebido:", { userId, data, custom_photo_url: data.custom_photo_url });

    // Se está atualizando a foto de perfil, deletar a anterior
    if (data.custom_photo_url !== undefined) {
      const currentProfile = await getUserProfile(userId);
      if (currentProfile?.custom_photo_url && currentProfile.custom_photo_url !== data.custom_photo_url) {
        try {
          // Extrair path da URL
          const urlObj = new URL(currentProfile.custom_photo_url);
          // As imagens de perfil são salvas no bucket "produtos" com path "perfis/..."
          const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/produtos\/(.+)/);
          if (pathMatch && supabaseAdmin) {
            const imagePath = pathMatch[1];
            const { error: deleteError } = await supabaseAdmin.storage
              .from("produtos")
              .remove([imagePath]);
            if (deleteError) {
              console.warn("⚠️ [API /api/user/update] Erro ao deletar imagem anterior:", deleteError);
            } else {
              console.log("✅ [API /api/user/update] Imagem anterior deletada com sucesso");
            }
          }
        } catch (error) {
          console.warn("⚠️ [API /api/user/update] Erro ao processar URL da imagem anterior:", error);
        }
      }
    }

    await updateUserProfile(userId, data);
    
    // Verificar se foi salvo corretamente
    const updatedProfile = await getUserProfile(userId);
    console.log("✅ [API /api/user/update] Perfil atualizado com sucesso. custom_photo_url:", updatedProfile?.custom_photo_url);
    
    return NextResponse.json({ 
      message: "Perfil atualizado",
      custom_photo_url: updatedProfile?.custom_photo_url 
    });
  } catch (error: any) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

