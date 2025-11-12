import {
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "./init"; // Usar init.ts para garantir que auth está sempre inicializado
import { getUserProfile, createUserProfile, updateUserProfile } from "@/lib/supabase/database";

// Configurar Google Auth Provider
const provider = new GoogleAuthProvider();

// Adicionar escopos necessários
provider.addScope('profile');
provider.addScope('email');

// Configurar para selecionar conta (não usar última conta)
provider.setCustomParameters({
  prompt: 'select_account'
});

// Função para processar resultado do redirect
// IMPORTANTE: Esta função DEVE ser chamada ANTES de onAuthStateChanged
// quando a página recarrega após o redirect do Google
export async function handleRedirectResult(): Promise<User | null> {
  // Verificar se estamos no cliente
  if (typeof window === "undefined") {
    // No servidor, não fazer nada (Firebase Auth só funciona no cliente)
    return null;
  }

  // Verificar se auth está disponível
  if (!auth) {
    console.error("❌ [handleRedirectResult] Auth não disponível!");
    console.error("❌ [handleRedirectResult] Firebase não foi inicializado corretamente");
    console.error("❌ [handleRedirectResult] Verifique se as variáveis de ambiente estão configuradas");
    return null;
  }
  
  console.log("🟡 [handleRedirectResult] ========== PROCESSANDO REDIRECT ==========");
  console.log("🟡 [handleRedirectResult] Auth disponível:", !!auth);
  console.log("🟡 [handleRedirectResult] Auth app:", auth.app.name);
  console.log("🟡 [handleRedirectResult] Chamando getRedirectResult(auth)...");
  console.log("🟡 [handleRedirectResult] URL atual:", window.location.href);
  
  try {
    // getRedirectResult() deve ser chamado ANTES de onAuthStateChanged
    // para capturar o resultado do redirect quando a página recarrega
    // Esta é a função CRÍTICA que recupera o estado de autenticação após o redirect
    const result = await getRedirectResult(auth);
    
    console.log("🟡 [handleRedirectResult] getRedirectResult() retornou:", result ? "resultado" : "null");
    
    if (result && result.user) {
      const user = result.user;
      
      console.log("✅ [handleRedirectResult] ========== REDIRECT RESULT ENCONTRADO! ==========");
      console.log("✅ [handleRedirectResult] Usuário autenticado:", user.email);
      console.log("✅ [handleRedirectResult] UID:", user.uid);
      console.log("✅ [handleRedirectResult] Display Name:", user.displayName);
      console.log("✅ [handleRedirectResult] Photo URL:", user.photoURL);
      console.log("✅ [handleRedirectResult] Provider:", user.providerData[0]?.providerId);
      
      // Verificar se o usuário já existe no Supabase
      try {
        console.log("🟡 [handleRedirectResult] Verificando perfil no Supabase...");
        const existingUser = await getUserProfile(user.uid);

        if (!existingUser) {
          // Criar perfil base para novo usuário no Supabase
          console.log("🟡 [handleRedirectResult] Criando perfil para novo usuário:", user.uid);
          await createUserProfile(user.uid, {
            email: user.email || "",
            display_name: user.displayName,
            photo_url: user.photoURL,
          });
          console.log("✅ [handleRedirectResult] Perfil criado no Supabase");
        } else {
          // Atualizar lastActiveAt
          console.log("🟡 [handleRedirectResult] Perfil existente, atualizando lastActiveAt...");
          await updateUserProfile(user.uid, {
            last_active_at: new Date().toISOString(),
          });
          console.log("✅ [handleRedirectResult] Perfil atualizado no Supabase");
        }
      } catch (dbError) {
        console.error("❌ [handleRedirectResult] Erro ao criar/atualizar perfil no Supabase:", dbError);
        // Continuar mesmo se houver erro no Supabase - o usuário já está autenticado no Firebase
      }

      console.log("✅ [handleRedirectResult] ===============================================");
      return user;
    } else {
      console.log("ℹ️ [handleRedirectResult] Nenhum redirect result encontrado");
      console.log("ℹ️ [handleRedirectResult] Isso é normal se a página não veio de um redirect do Google");
    }
    
    return null;
  } catch (error: any) {
    // Ignorar erros de "no redirect result" (normal quando não há redirect)
    if (error.code === "auth/no-auth-event") {
      console.log("ℹ️ [handleRedirectResult] Nenhum evento de auth (normal - não veio de redirect)");
    } else {
      console.error("❌ [handleRedirectResult] ERRO ao processar redirect:", error);
      console.error("❌ [handleRedirectResult] Código:", error.code);
      console.error("❌ [handleRedirectResult] Mensagem:", error.message);
      console.error("❌ [handleRedirectResult] Stack:", error.stack);
    }
    return null;
  }
}

export async function signInWithGoogle(): Promise<void> {
  console.log("🔵 [signInWithGoogle] ========== INICIANDO LOGIN ==========");
  
  if (!auth) {
    const errorMsg = "Firebase não está configurado. Configure as variáveis de ambiente no arquivo .env.local";
    console.error("❌ [signInWithGoogle]", errorMsg);
    alert(errorMsg);
    throw new Error(errorMsg);
  }

  // Verificar se estamos em um ambiente válido
  if (typeof window === "undefined") {
    const errorMsg = "signInWithGoogle só pode ser chamado no cliente (browser)";
    console.error("❌ [signInWithGoogle]", errorMsg);
    throw new Error(errorMsg);
  }

  try {
    console.log("🔵 [signInWithGoogle] Auth disponível:", !!auth);
    console.log("🔵 [signInWithGoogle] Auth app:", auth.app.name);
    console.log("🔵 [signInWithGoogle] Provider:", provider.providerId);
    console.log("🔵 [signInWithGoogle] Current URL:", window.location.href);
    console.log("🔵 [signInWithGoogle] Hostname:", window.location.hostname);
    
    console.log("🔵 [signInWithGoogle] Chamando signInWithRedirect...");
    console.log("🔵 [signInWithGoogle] Isso vai redirecionar a página para o Google");
    
    // Usar redirect - redireciona a página atual para o Google
    // Se funcionar, a página será redirecionada e não chegaremos nas linhas abaixo
    await signInWithRedirect(auth, provider);
    
    // Se chegou aqui, algo deu errado (não deveria acontecer)
    console.warn("⚠️ [signInWithGoogle] signInWithRedirect retornou sem redirecionar!");
    console.warn("⚠️ [signInWithGoogle] Isso não deveria acontecer - a página deveria ter sido redirecionada");

  } catch (error: any) {
    console.error("❌ [signInWithGoogle] ========== ERRO CAPTURADO ==========");
    console.error("❌ [signInWithGoogle] Erro completo:", error);
    console.error("❌ [signInWithGoogle] Tipo:", typeof error);
    console.error("❌ [signInWithGoogle] Código do erro:", error?.code);
    console.error("❌ [signInWithGoogle] Mensagem:", error?.message);
    console.error("❌ [signInWithGoogle] Stack:", error?.stack);
    console.error("❌ [signInWithGoogle] =====================================");
    
    // Mostrar erro mais detalhado
    let errorMsg = "Erro ao fazer login. Tente novamente.";
    
    if (error?.code === "auth/unauthorized-domain") {
      errorMsg = `❌ Domínio não autorizado!\n\nAdicione "${window.location.hostname}" aos domínios autorizados no Firebase Console:\n\n1. Vá em Authentication > Settings\n2. Role até "Authorized domains"\n3. Clique em "Add domain"\n4. Adicione "${window.location.hostname}"`;
      console.error("❌ [signInWithGoogle]", errorMsg);
    } else if (error?.code === "auth/operation-not-allowed") {
      errorMsg = `❌ Google Sign-In não está habilitado!\n\n1. Acesse: https://console.firebase.google.com\n2. Vá em Authentication > Sign-in method\n3. Clique em "Google"\n4. ATIVE o toggle "Enable"\n5. Preencha o "Project support email"\n6. Clique em "Save"`;
      console.error("❌ [signInWithGoogle]", errorMsg);
    } else if (error?.message) {
      errorMsg = `Erro: ${error.message}\n\nCódigo: ${error.code || "N/A"}`;
    }
    
    alert(errorMsg);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  if (!auth) {
    throw new Error("Firebase não está configurado");
  }
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    console.warn("Firebase não está configurado");
    return () => {}; // Retorna função vazia se não houver auth
  }
  return onAuthStateChanged(auth, callback);
}

export { auth };

