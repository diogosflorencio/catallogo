"use client";

import { useEffect, useState } from "react";
import { signInWithGoogle, signOut, auth, getCurrentUser } from "@/lib/firebase/auth-simple";
import { onAuthStateChanged, User } from "firebase/auth";

export default function LoginSimplesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    setUser(getCurrentUser());
    setLoading(false);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      const user = await signInWithGoogle();
      console.log("Login OK:", user.email);
    } catch (err: any) {
      console.error("Erro:", err);
      setError(err.message || "Erro ao fazer login");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer logout");
    }
  };

  if (loading && !user) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="min-h-screen p-8 flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Login Simples - Firebase</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}

        {user ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded">
              <p className="font-semibold text-green-800">✅ Logado!</p>
              <p className="text-sm text-gray-600 mt-2">Email: {user.email}</p>
              <p className="text-sm text-gray-600">UID: {user.uid}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sair
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar com Google"}
          </button>
        )}
      </div>
    </div>
  );
}

