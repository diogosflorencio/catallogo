"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PublicCatalogoView } from "@/components/catalogo/PublicCatalogoView";
import { Loading } from "@/components/ui/Loading";
import { UserProfile, Catalogo, Produto } from "@/lib/supabase/database";

export default function PublicCatalogoPage() {
  const params = useParams();
  const username = params?.username as string;
  const catalogSlug = params?.catalogSlug as string;
  const [data, setData] = useState<{
    catalogo: Catalogo;
    produtos: Produto[];
    user: UserProfile;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username || !catalogSlug) return;
    
    async function loadData() {
      try {
        const response = await fetch(`/api/public/${username}/${catalogSlug}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Erro ao carregar catálogo:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [username, catalogSlug]);

  if (loading) {
    return <Loading message="Carregando catálogo..." fullScreen />;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/70 mb-4">Catálogo não encontrado</p>
          <a href="/" className="text-primary hover:underline">Voltar para home</a>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider userProfile={data.user} isLandingPage={false}>
      <PublicCatalogoView data={data} username={username} catalogSlug={catalogSlug} />
    </ThemeProvider>
  );
}

