"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { UserProfile, Catalogo } from "@/lib/supabase/database";
import { Loading } from "@/components/ui/Loading";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    
    async function loadData() {
      try {
        const response = await fetch(`/api/public/user/${username}`);
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setCatalogos(data.catalogos.filter((c: Catalogo) => c.public));
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [username]);

  if (loading) {
    return <Loading message="Carregando perfil..." fullScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/70 mb-4">Perfil não encontrado</p>
          <Link href="/" className="text-primary hover:underline">Voltar para home</Link>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider userProfile={user} isLandingPage={false}>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-blush/20 bg-background-alt/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {user.custom_photo_url && (
              <img
                src={user.custom_photo_url}
                alt={user.nome_loja || user.username || ""}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="font-display font-semibold text-2xl">
                {user.nome_loja || user.username}
              </h1>
              {user.display_name && (
                <p className="text-sm text-foreground/60">{user.display_name}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {catalogos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-foreground/60">Nenhum catálogo público disponível</p>
          </div>
        ) : (
          <>
            <h2 className="font-display font-semibold text-xl mb-6">
              Meus Catálogos
            </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catalogos.map((catalogo) => (
                      <div
                        key={catalogo.id}
                        className="bg-background-alt rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="p-6">
                          <h3 className="font-display font-semibold text-lg mb-2">
                            {catalogo.nome}
                          </h3>
                          {catalogo.descricao && (
                            <p className="text-sm text-foreground/60 mb-4 line-clamp-3">
                              {catalogo.descricao}
                            </p>
                          )}
                          <div className="flex flex-col gap-2">
                            <Link
                              href={`/${username}/${catalogo.slug}`}
                              className="w-full bg-primary hover:bg-primary/90 text-foreground rounded-lg py-2 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Ver Catálogo
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-blush/20 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-foreground/60 text-sm">
          <p>Powered by Catallogo</p>
        </div>
      </footer>
      </div>
    </ThemeProvider>
  );
}

