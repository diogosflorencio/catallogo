"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, ExternalLink, Share2 } from "lucide-react";
import { Produto, UserProfile } from "@/lib/supabase/database";
import { generateWhatsAppLink, replaceTemplateVariables } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { trackEvent } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

interface ProductModalProps {
  produto: Produto;
  user: UserProfile;
  catalogSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({
  produto,
  user,
  catalogSlug,
  isOpen,
  onClose,
}: ProductModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  function handleWhatsAppClick() {
    const message = replaceTemplateVariables(user.mensagem_template, {
      produtoNome: produto.nome,
    });

    const whatsappLink = generateWhatsAppLink(
      user.whatsapp_number || "",
      message
    );

    trackEvent({
      type: "whatsapp_click",
      username: user.username || "",
      catalogSlug,
      produtoId: produto.id,
      timestamp: new Date(),
    });

    window.open(whatsappLink, "_blank");
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: produto.nome,
        text: produto.descricao || "",
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback: copiar URL
      navigator.clipboard.writeText(window.location.href);
      alert("Link copiado para a área de transferência!");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-blush/20 p-4 flex items-start justify-between z-10">
                <div className="flex-1">
                  <h2 className="font-display font-semibold text-xl mb-1">
                    {produto.nome}
                  </h2>
                  {produto.preco && (
                    <p className="text-primary font-semibold text-lg">
                      {formatPrice(Number(produto.preco))}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2 hover:bg-background-alt rounded-lg transition-colors"
                    aria-label="Compartilhar"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-background-alt rounded-lg transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Image */}
                {produto.imagem_url && (
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-background-alt">
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-pulse bg-blush/20 w-full h-full" />
                      </div>
                    )}
                    <img
                      src={produto.imagem_url}
                      alt={produto.nome}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        imageLoaded ? "opacity-100" : "opacity-0"
                      }`}
                      onLoad={() => setImageLoaded(true)}
                    />
                  </div>
                )}

                {/* Description */}
                {produto.descricao && (
                  <div>
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-foreground/70 whitespace-pre-line">
                      {produto.descricao}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-blush/20">
                  {produto.link_externo && (
                    <a
                      href={produto.link_externo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-primary hover:bg-primary/90 text-foreground rounded-lg py-3 px-6 flex items-center justify-center gap-2 transition-colors font-medium"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Ver Produto
                    </a>
                  )}
                  <button
                    onClick={handleWhatsAppClick}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-lg py-3 px-6 flex items-center justify-center gap-2 transition-colors font-medium"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Falar no WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

