// VERSÃO SIMPLES - APENAS O NECESSÁRIO PARA LOGIN COM GOOGLE
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Inicializar Firebase apenas uma vez
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// Provider do Google
const googleProvider = new GoogleAuthProvider();

// Login com Google
export async function loginWithGoogle() {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    console.error("Erro no login:", error);
    alert(`Erro: ${error.message}`);
    throw error;
  }
}

// Verificar resultado do redirect
export async function checkRedirect() {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error: any) {
    console.error("Erro ao verificar redirect:", error);
    return null;
  }
}

// Obter usuário atual
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

