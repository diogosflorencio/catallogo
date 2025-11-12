"use client";

import { useEffect, useState } from "react";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/init";
import { Button } from "@/components/ui/Button";

export default function TestFirebasePage() {
  const [status, setStatus] = useState<string>("Verificando...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkFirebase();
  }, []);

  async function checkFirebase() {
    try {
      setStatus("Verificando Firebase...");
      
      if (!auth) {
        setError("Firebase Auth não está disponível");
        setStatus("❌ Erro");
        return;
      }

      setStatus("Firebase Auth disponível ✅");
      
      // Verificar se há usuário logado
      const currentUser = auth.currentUser;
      if (currentUser) {
        setStatus(`Usuário logado: ${currentUser.email} ✅`);
      } else {
        setStatus("Nenhum usuário logado");
      }
    } catch (err: any) {
      setError(err.message);
      setStatus("❌ Erro");
    }
  }

  async function handleTestLogin() {
    try {
      setStatus("Tentando fazer login...");
      setError(null);
      
      console.log("🧪 [Test] Botão clicado - iniciando login");
      
      await signInWithGoogle();
      
      // Se chegou aqui, o redirect não funcionou
      setStatus("⚠️ Redirect não aconteceu - verifique os logs");
      setError("O redirect deveria ter redirecionado a página");
      
    } catch (err: any) {
      console.error("🧪 [Test] Erro:", err);
      setError(`Erro: ${err.code || err.message}`);
      setStatus("❌ Erro no login");
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Teste Firebase Auth</h1>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-4">
          <h2 className="text-xl font-semibold mb-2">Status</h2>
          <p className="mb-4">{status}</p>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900 p-4 rounded mb-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <Button onClick={handleTestLogin} className="w-full">
              Testar Login com Google
            </Button>
            
            <Button onClick={checkFirebase} variant="outline" className="w-full">
              Verificar Status Novamente
            </Button>
          </div>
        </div>

        <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded">
          <h3 className="font-semibold mb-2">Verificações Necessárias:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Google Sign-In habilitado no Firebase Console</li>
            <li>Domínio localhost autorizado</li>
            <li>Variáveis de ambiente configuradas</li>
            <li>Nenhum bloqueador de popup/redirect ativo</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

