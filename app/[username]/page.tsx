"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
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
      <div className="min-h-screen bg-background dark:bg-[#0f0f0f] flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="border-b border-foreground/[0.03] dark:border-foreground/[0.08] bg-background-alt dark:bg-[#181818] sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-3 py-3">
          <div className="flex items-center gap-3">
            {user.custom_photo_url && (
              <motion.img
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                src={user.custom_photo_url}
                alt={user.nome_loja || user.username || ""}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <motion.h1
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="font-display font-semibold text-base truncate text-foreground dark:text-foreground/90"
              >
                {user.nome_loja || user.username}
              </motion.h1>
              {user.username && (
                <motion.p
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-[10px] text-foreground/60 dark:text-foreground/50 truncate"
                >
                  @{user.username}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 py-6 flex-1 pb-16">
        {catalogos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <p className="text-foreground/60 dark:text-foreground/50">Nenhum catálogo público disponível</p>
          </motion.div>
        ) : (
          <>
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-display font-semibold text-lg mb-4 text-foreground dark:text-foreground/90"
            >
              Meus Catálogos
            </motion.h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {catalogos.map((catalogo, index) => (
                <motion.div
                  key={catalogo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02, type: "spring", stiffness: 100 }}
                  className="group relative bg-background-alt dark:bg-[#181818] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-150 cursor-pointer"
                >
                  <Link
                    href={`/${username}/${catalogo.slug}`}
                    className="block"
                  >
                    <div className="p-2.5">
                      <h3 className="font-display font-semibold text-xs mb-1.5 line-clamp-2 leading-tight text-foreground dark:text-foreground/90">
                        {catalogo.nome}
                      </h3>
                      {catalogo.descricao && (
                        <p className="text-[10px] text-foreground/60 dark:text-foreground/50 mb-2.5 line-clamp-2 leading-tight">
                          {catalogo.descricao}
                        </p>
                      )}
                      <div className="w-full bg-primary hover:bg-primary/90 text-white dark:text-foreground rounded-lg py-1.5 px-3 flex items-center justify-center gap-1.5 transition-colors text-[10px] font-medium">
                        <ExternalLink className="w-3 h-3" />
                        <span>Ver</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="fixed bottom-0 left-0 right-0 bg-background-alt dark:bg-[#181818] border-t border-foreground/[0.03] dark:border-foreground/[0.08] py-1.5 z-40"
      >
        <div className="max-w-7xl mx-auto px-3 flex items-center justify-center gap-2 text-[10px] text-foreground/60 dark:text-foreground/50">
          <Sparkles className="w-2.5 h-2.5 text-primary" />
          <span>Criado com</span>
          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary font-medium hover:underline inline-flex items-center gap-0.5"
          >
            Catallogo
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </motion.footer>
      </div>
    </ThemeProvider>
  );
}

