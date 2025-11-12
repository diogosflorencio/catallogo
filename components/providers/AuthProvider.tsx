"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/auth-simple";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Quando o usuário faz login, garantir que ele existe no Supabase
      if (currentUser) {
        try {
          // Chamar API route para criar/atualizar perfil no Supabase
          const token = await currentUser.getIdToken();
          const response = await fetch("/api/user/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: currentUser.email,
              display_name: currentUser.displayName,
              photo_url: currentUser.photoURL,
            }),
          });

          if (response.ok) {
            console.log("✅ Perfil sincronizado com Supabase");
          } else {
            console.error("❌ Erro ao sincronizar perfil:", await response.text());
          }
        } catch (error) {
          console.error("❌ Erro ao sincronizar com Supabase:", error);
          // Não bloquear o login se houver erro no Supabase
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
