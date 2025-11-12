"use client";

import { motion } from "framer-motion";
import { generateWhatsAppLink, replaceTemplateVariables } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { trackEvent } from "@/lib/supabase/client";
import { UserProfile, Catalogo, Produto } from "@/lib/supabase/database";
import { MessageCircle, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductModal } from "./ProductModal";

interface PublicCatalogoViewProps {
  data: {
    catalogo: Catalogo;
    produtos: Produto[];
    user: UserProfile;
  };
  username: string;
  catalogSlug: string;
}

export function PublicCatalogoView({ data, username, catalogSlug }: PublicCatalogoViewProps) {
  const { catalogo, produtos, user } = data;
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Registrar visualização
  useEffect(() => {
    trackEvent({
      type: "view",
      username,
      catalogSlug,
      timestamp: new Date(),
    }).catch(console.error);
  }, [username, catalogSlug]);

  function handleProductClick(produto: Produto) {
    setSelectedProduct(produto);
    setIsModalOpen(true);
  }

  function handleWhatsAppClick(produto: Produto) {
    const message = replaceTemplateVariables(user.mensagem_template, {
      produtoNome: produto.nome,
    });

    const whatsappLink = generateWhatsAppLink(
      user.whatsapp_number || "",
      message
    );

    // Registrar clique
    trackEvent({
      type: "whatsapp_click",
      username: user.username || "",
      catalogSlug: catalogo.slug,
      produtoId: produto.id,
      timestamp: new Date(),
    });

    window.open(whatsappLink, "_blank");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-blush/20 bg-background-alt/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {user.photo_url && (
              <img
                src={user.photo_url}
                alt={user.nome_loja || ""}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="font-display font-semibold text-lg">
                {user.nome_loja || user.username}
              </h1>
              <p className="text-sm text-foreground/60">{catalogo.nome}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {catalogo.descricao && (
          <p className="text-center text-foreground/70 mb-8">
            {catalogo.descricao}
          </p>
        )}

        {produtos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-foreground/60">Nenhum produto disponível</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {produtos.map((produto, index) => (
              <motion.div
                key={produto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-background-alt rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handleProductClick(produto)}
              >
                {produto.imagem_url && (
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={produto.imagem_url}
                      alt={produto.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-display font-semibold mb-1 line-clamp-1">
                    {produto.nome}
                  </h3>
                  {produto.descricao && (
                    <p className="text-sm text-foreground/60 mb-2 line-clamp-2">
                      {produto.descricao}
                    </p>
                  )}
                  {produto.preco && (
                    <p className="font-semibold text-primary mb-3">
                      {formatPrice(Number(produto.preco))}
                    </p>
                  )}
                  <div className="text-xs text-foreground/50">
                    Clique para ver mais detalhes
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-blush/20 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-foreground/60 text-sm">
          <p>Powered by Catallogo</p>
        </div>
      </footer>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          produto={selectedProduct}
          user={user}
          catalogSlug={catalogSlug}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setTimeout(() => setSelectedProduct(null), 300);
          }}
        />
      )}
    </div>
  );
}

