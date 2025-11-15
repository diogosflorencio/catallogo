"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserProfile, Catalogo } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);

  useEffect(() => {
    // Exigir login
    if (!loading && !user) {
      router.push("/perfil");
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, loading, router]);

  async function loadData() {
    if (!user) return;
    
    try {
      // Buscar perfil via API route (não usar diretamente no cliente)
      const token = await user.getIdToken();
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userProfile = await response.json();
        // Verificar se o perfil está completo
        if (!userProfile.username || !userProfile.nome_loja || !userProfile.whatsapp_number) {
          // Perfil incompleto - redirecionar para completar
          window.location.href = "/um-pouco-sobre-voce";
          return;
        }
        setProfile(userProfile);
        
        // Buscar catálogos via API route (retorna todos, públicos e privados)
        const catalogosResponse = await fetch("/api/catalogos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (catalogosResponse.ok) {
          const cats = await catalogosResponse.json();
          setCatalogos(cats);
        } else {
          console.error("Erro ao buscar catálogos:", await catalogosResponse.text());
        }
      } else {
        console.error("Erro ao buscar perfil:", await response.text());
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lavender">Carregando...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Será redirecionado pelo useEffect
  }

  return (
    <DashboardLayout profile={profile}>
      <DashboardHome catalogos={catalogos} profile={profile} />
    </DashboardLayout>
  );
}

