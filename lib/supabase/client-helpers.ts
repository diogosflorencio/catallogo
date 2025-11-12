// Funções helper para uso no cliente (via API routes)
import { UserProfile } from "./database";

export async function fetchUserProfile(userId: string, token: string): Promise<UserProfile | null> {
  try {
    const response = await fetch("/api/user/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error("Erro ao buscar perfil:", await response.text());
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return null;
  }
}

