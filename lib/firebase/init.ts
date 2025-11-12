import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Garantir que o Firebase App sempre exista (mesmo após redirect)
// Isso é CRÍTICO para o handleRedirectResult funcionar
// Usa getApp() se já existe, senão initializeApp() - previne múltiplas instâncias
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (typeof window !== "undefined") {
  // Verificar se as variáveis de ambiente estão configuradas
  const hasConfig = 
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId;

  if (hasConfig) {
    try {
      // Se já existe uma instância, use ela; caso contrário, crie uma nova
      // Isso previne múltiplas instâncias e garante que o estado seja mantido após redirect
      if (getApps().length > 0) {
        console.log("✅ [Firebase Init] Usando instância existente do Firebase");
        app = getApp();
      } else {
        console.log("✅ [Firebase Init] Criando nova instância do Firebase");
        app = initializeApp(firebaseConfig);
        console.log("✅ [Firebase Init] Firebase App criado:", app.name);
      }
      
      // Sempre obter o auth da mesma instância do app
      auth = getAuth(app);
      console.log("✅ [Firebase Init] Firebase Auth inicializado");
      console.log("✅ [Firebase Init] Auth app:", auth.app.name);
      console.log("✅ [Firebase Init] Auth currentUser:", auth.currentUser?.email || "null");
      
    } catch (error: any) {
      console.error("❌ [Firebase Init] ERRO ao inicializar Firebase:", error);
      console.error("❌ [Firebase Init] Mensagem:", error.message);
      console.error("❌ [Firebase Init] Stack:", error.stack);
      // Não lançar erro aqui - deixar auth como null e tratar nos componentes
    }
  } else {
    console.error("❌ [Firebase Init] Firebase não configurado - variáveis de ambiente faltando");
    console.error("❌ [Firebase Init] Configure as variáveis NEXT_PUBLIC_FIREBASE_* no .env.local");
    // Não lançar erro - deixar auth como null
  }
} else {
  // No servidor, auth será null (normal - Firebase Auth só funciona no cliente)
  // Não logar nada no servidor para evitar poluição dos logs
  // O código do cliente vai inicializar corretamente
}

export { app, auth };
