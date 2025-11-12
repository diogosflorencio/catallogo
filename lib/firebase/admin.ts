// Para verificar tokens do Firebase no servidor
// IMPORTANTE: Em produção, use Firebase Admin SDK para verificação real
// Por enquanto, vamos decodificar o JWT (não é seguro para produção, mas funciona para desenvolvimento)

export async function verifyIdToken(token: string): Promise<{ uid: string; email?: string }> {
  try {
    // Decodificar JWT (apenas para desenvolvimento)
    // Em produção, use: admin.auth().verifyIdToken(token)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error("Token inválido");
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Verificar se o token não expirou
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error("Token expirado");
    }

    return {
      uid: payload.user_id || payload.sub || payload.uid,
      email: payload.email,
    };
  } catch (error: any) {
    console.error("Erro ao verificar token:", error);
    throw new Error("Token inválido");
  }
}

