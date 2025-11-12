"use client";

import { useEffect, useState } from "react";
import { loginWithGoogle, checkRedirect, getCurrentUser, auth } from "@/lib/firebase/simple-auth";
import { onAuthStateChanged, User } from "firebase/auth";

export default function TestLoginPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar redirect primeiro
    checkRedirect().then((user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      }
    });

    // Listener de mudanças
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold">Teste de Login - VERSÃO SIMPLES</h1>
        
        {user ? (
          <div className="p-4 bg-green-100 rounded">
            <h2 className="font-semibold text-green-800">✅ LOGADO!</h2>
            <p>Email: {user.email}</p>
            <p>UID: {user.uid}</p>
            <button
              onClick={() => auth.signOut()}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
            >
              Sair
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={handleLogin}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Entrar com Google
            </button>
          </div>
        )}

        <div className="p-4 bg-yellow-100 rounded text-sm">
          <p className="font-semibold">Verificações necessárias:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Google Sign-In habilitado no Firebase Console</li>
            <li>Domínio localhost autorizado</li>
            <li>Variáveis de ambiente configuradas no .env.local</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

