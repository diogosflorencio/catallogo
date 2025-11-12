import { getUidByUsername, getCatalogos, getUserProfile } from "@/lib/supabase/database";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  
  // Buscar usuário pelo username
  const userId = await getUidByUsername(username);
  if (!userId) {
    notFound();
  }

  // Buscar perfil e catálogos públicos
  const user = await getUserProfile(userId);
  if (!user) {
    notFound();
  }

  const catalogos = await getCatalogos(userId);
  const catalogosPublicos = catalogos.filter((c) => c.public);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-blush/20 bg-background-alt/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {user.photo_url && (
              <img
                src={user.photo_url}
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
        {catalogosPublicos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-foreground/60">Nenhum catálogo público disponível</p>
          </div>
        ) : (
          <>
            <h2 className="font-display font-semibold text-xl mb-6">
              Meus Catálogos
            </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catalogosPublicos.map((catalogo) => (
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
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const userId = await getUidByUsername(username);
  
  if (!userId) {
    return {
      title: "Perfil não encontrado",
    };
  }

  const user = await getUserProfile(userId);
  if (!user) {
    return {
      title: "Perfil não encontrado",
    };
  }

  return {
    title: `${user.nome_loja || user.username} - Catálogos`,
    description: `Catálogos de produtos de ${user.nome_loja || user.username}`,
    openGraph: {
      title: `${user.nome_loja || user.username} - Catálogos`,
      description: `Catálogos de produtos de ${user.nome_loja || user.username}`,
      images: user.photo_url ? [user.photo_url] : [],
    },
  };
}

