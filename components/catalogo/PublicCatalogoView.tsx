"use client";

import { motion, AnimatePresence, useMotionValue, PanInfo } from "framer-motion";
import { generateWhatsAppLink, replaceTemplateVariables } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { trackEvent } from "@/lib/supabase/client";
import { UserProfile, Catalogo, Produto } from "@/lib/supabase/database";
import { MessageCircle, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Image as ImageIcon, Sparkles, X, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";

interface PublicCatalogoViewProps {
  data: {
    catalogo: Catalogo;
    produtos: Produto[];
    user: UserProfile;
  };
  username: string;
  catalogSlug: string;
}

// Componente de Skeleton Loader
function ProductSkeleton() {
  return (
    <div className="bg-background-alt dark:bg-[#181818] rounded-xl overflow-hidden border border-foreground/[0.03] dark:border-foreground/[0.08] animate-pulse">
      <div className="aspect-[3/4] bg-foreground/10" />
      <div className="p-1.5 space-y-2">
        <div className="h-3 bg-foreground/10 rounded w-3/4" />
        <div className="h-2.5 bg-foreground/10 rounded w-1/2" />
      </div>
    </div>
  );
}

export function PublicCatalogoView({ data, username, catalogSlug }: PublicCatalogoViewProps) {
  const { catalogo, produtos, user } = data;
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const dragX = useMotionValue(0);

  // Registrar visualização
  useEffect(() => {
    trackEvent({
      type: "view",
      username,
      catalogSlug,
      timestamp: new Date(),
    }).catch(console.error);
  }, [username, catalogSlug]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Simular loading inicial
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-play de imagens no modal
  useEffect(() => {
    if (!selectedProduct || !isModalOpen || !isAutoPlaying) return;

    const imagens = getProductImages(selectedProduct);
    if (imagens.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedProduct, isModalOpen, isAutoPlaying]);

  // Reset image index when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setCurrentImageIndex(0);
      setIsAutoPlaying(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isModalOpen]);

  function getProductImages(produto: Produto): string[] {
    return (produto.imagens_urls && Array.isArray(produto.imagens_urls) && produto.imagens_urls.length > 0)
      ? produto.imagens_urls
      : (produto.imagem_url ? [produto.imagem_url] : []);
  }


  function handleProductClick(produto: Produto) {
    setSelectedProduct(produto);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  }

  function handleWhatsAppClick(produto: Produto, e?: React.MouseEvent) {
    if (e) e.stopPropagation();

    const message = replaceTemplateVariables(user.mensagem_template, {
      produtoNome: produto.nome,
    });

    const whatsappLink = generateWhatsAppLink(user.whatsapp_number || "", message);

    trackEvent({
      type: "whatsapp_click",
      username: user.username || "",
      catalogSlug: catalogo.slug,
      produtoId: produto.id,
      timestamp: new Date(),
    });

    window.open(whatsappLink, "_blank");
  }

  function handleShare(produto: Produto, e: React.MouseEvent) {
    e.stopPropagation();
    
    const shareData = {
      title: produto.nome,
      text: `${produto.nome} - ${produto.preco ? formatPrice(Number(produto.preco)) : ''}`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }


  const nextImage = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsAutoPlaying(false);
    if (selectedProduct) {
      const imagens = getProductImages(selectedProduct);
      setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
    }
  }, [selectedProduct]);

  const prevImage = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsAutoPlaying(false);
    if (selectedProduct) {
      const imagens = getProductImages(selectedProduct);
      setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length);
    }
  }, [selectedProduct]);

  function handleDragEnd(event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const threshold = 50;
    if (info.offset.x > threshold) {
      prevImage();
    } else if (info.offset.x < -threshold) {
      nextImage();
    }
    dragX.set(0);
  }

  const filteredAndSortedProdutos = useMemo(() => {
    let filtered = [...produtos].filter(p => p.visivel);
    if (sortOrder === null) return filtered;
    return filtered.sort((a, b) => {
      const precoA = a.preco || 0;
      const precoB = b.preco || 0;
      return sortOrder === "asc" ? precoA - precoB : precoB - precoA;
    });
  }, [produtos, sortOrder]);

  function handleSortToggle() {
    setSortOrder(sortOrder === null ? "asc" : sortOrder === "asc" ? "desc" : null);
  }

  function handleImageLoad(src: string) {
    setLoadedImages(prev => new Set(prev).add(src));
  }

  // Gerar gradientes baseados no tema do usuário
  const getGradientForIndex = (index: number) => {
    // Usar variáveis CSS do tema (primary, secondary, accent)
    // Criar variações sutis para cada card
    const variations = [
      'from-primary/20 to-secondary/20',
      'from-secondary/20 to-accent/20',
      'from-accent/20 to-primary/20',
      'from-primary/15 to-accent/15',
      'from-secondary/15 to-primary/15',
      'from-accent/15 to-secondary/15',
    ];
    return variations[index % variations.length];
  };

  return (
    <div className="min-h-screen bg-background dark:bg-[#0f0f0f]">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--foreground);
          opacity: 0.1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          opacity: 0.2;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          opacity: 0.15;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          opacity: 0.25;
        }
      `}</style>

      {/* Header compacto */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-background-alt border-b border-foreground/[0.03] dark:border-foreground/[0.08] sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center gap-2">
          {user.custom_photo_url && (
            <motion.img
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              src={user.custom_photo_url}
              alt=""
              className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
            />
          )}
          <div className="flex-1 min-w-0">
            <motion.h1
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-display font-semibold text-sm truncate text-foreground dark:text-foreground/90"
            >
              {user.nome_loja || user.username}
            </motion.h1>
            <motion.p
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[10px] text-foreground/60 dark:text-foreground/50 truncate"
            >
              {catalogo.nome}
            </motion.p>
          </div>
        </div>
      </motion.header>

      {/* Grid compacto */}
      <main className="max-w-7xl mx-auto px-3 py-3 pb-16">
        {catalogo.descricao && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs text-foreground/70 dark:text-foreground/60 mb-4 px-2"
          >
            {catalogo.descricao}
          </motion.p>
        )}

        {/* Botão de ordenação */}
        {filteredAndSortedProdutos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-end mb-3"
          >
            <button
              onClick={handleSortToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground/70 dark:text-foreground/60 bg-background-alt dark:bg-[#181818] rounded-full border border-foreground/[0.03] dark:border-foreground/[0.08] hover:border-primary/40 transition-all shadow-sm active:scale-95"
            >
              {sortOrder === null ? (
                <>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Ordenar por preço</span>
                </>
              ) : sortOrder === "asc" ? (
                <>
                  <ArrowUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  <span>Menor preço</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>Maior preço</span>
                </>
              )}
            </button>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {[...Array(12)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {filteredAndSortedProdutos.map((produto, i) => {
              const imagens = getProductImages(produto);
              const primeiraImagem = imagens[0];
              const quantidadeImagens = imagens.length;
              const isImageLoaded = primeiraImagem ? loadedImages.has(primeiraImagem) : false;
              const gradient = getGradientForIndex(i);
              
              return (
                <motion.div
                  key={produto.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02, type: "spring", stiffness: 100 }}
                  onClick={() => handleProductClick(produto)}
                  className="group relative bg-background-alt dark:bg-[#181818] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-150 cursor-pointer border border-foreground/[0.03] dark:border-foreground/[0.08] hover:border-primary/20"
                >
                  {primeiraImagem ? (
                    <div className="relative aspect-[3/4] overflow-hidden">
                      {!isImageLoaded && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} animate-pulse`} />
                      )}
                      <motion.img
                        src={primeiraImagem}
                        alt={produto.nome}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-150"
                        onLoad={() => handleImageLoad(primeiraImagem)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isImageLoaded ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      
                      {quantidadeImagens > 1 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 }}
                          className="absolute top-1 right-1"
                        >
                          <span className="flex items-center gap-0.5 text-[8px] px-1 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
                            <ImageIcon className="w-2 h-2" />
                            {quantidadeImagens}
                          </span>
                        </motion.div>
                      )}
                      
                      <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleWhatsAppClick(produto, e)}
                        className="absolute bottom-1 right-1 bg-[#25D366] text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Falar no WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </motion.button>
                    </div>
                  ) : (
                    <div className={`aspect-[3/4] bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <ImageIcon className="w-8 h-8 text-foreground/30" />
                    </div>
                  )}
                  
                  <div className="p-1.5">
                    <h3 className="text-[11px] font-medium line-clamp-2 leading-tight text-foreground dark:text-foreground/90 mb-0.5">
                      {produto.nome}
                    </h3>
                    {produto.preco && (
                      <p className="text-xs font-bold text-primary">
                        {formatPrice(Number(produto.preco))}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer minimalista */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="fixed bottom-0 left-0 right-0 bg-background-alt border-t border-foreground/[0.03] dark:border-foreground/[0.08] py-1.5 z-40"
      >
        <div className="max-w-7xl mx-auto px-3 flex items-center justify-center gap-2 text-[10px] text-foreground/60 dark:text-foreground/50">
          <Sparkles className="w-2.5 h-2.5 text-primary" />
          <span>Criado com</span>
          <a 
            href={baseUrl || "/"} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary font-medium hover:underline inline-flex items-center gap-0.5"
          >
            Catallogo
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </motion.footer>

      {/* Modal otimizado */}
      <AnimatePresence>
        {selectedProduct && isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-background-alt dark:bg-[#181818] rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg sm:max-h-[85vh] flex flex-col m-4 custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header minimalista */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/[0.03] dark:border-foreground/[0.08] flex-shrink-0">
                <h2 className="text-sm font-display font-semibold flex-1 pr-2 truncate text-foreground dark:text-foreground/90">
                  {selectedProduct.nome}
                </h2>
                <div className="flex gap-1">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleShare(selectedProduct, e)} 
                    className="p-1.5 hover:bg-foreground/5 rounded-lg transition-colors"
                    aria-label="Compartilhar"
                  >
                    <Share2 className="w-4 h-4 text-foreground/70 dark:text-foreground/60" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCloseModal} 
                    className="p-1.5 hover:bg-foreground/5 rounded-lg transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="w-4 h-4 text-foreground/70 dark:text-foreground/60" />
                  </motion.button>
                </div>
              </div>

              {/* Carrossel com drag */}
              {(() => {
                const imagens = getProductImages(selectedProduct);
                return imagens.length > 0 && (
                  <div className="relative bg-foreground/5 flex-shrink-0">
                    <motion.div 
                      className="relative aspect-[4/3] touch-none"
                      drag={imagens.length > 1 ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.3}
                      dragDirectionLock
                      onDragEnd={handleDragEnd}
                      style={{ x: dragX }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={currentImageIndex}
                          src={imagens[currentImageIndex]}
                          alt={selectedProduct.nome}
                          className="w-full h-full object-contain"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      </AnimatePresence>

                      {imagens.length > 1 && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background-alt/90 hover:bg-background-alt p-1.5 rounded-full backdrop-blur-sm transition-colors shadow-lg"
                            aria-label="Imagem anterior"
                          >
                            <ChevronLeft className="w-4 h-4 text-foreground/70 dark:text-foreground/60" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background-alt/90 hover:bg-background-alt p-1.5 rounded-full backdrop-blur-sm transition-colors shadow-lg"
                            aria-label="Próxima imagem"
                          >
                            <ChevronRight className="w-4 h-4 text-foreground/70 dark:text-foreground/60" />
                          </motion.button>

                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {imagens.map((_, idx) => (
                              <motion.button
                                key={idx}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentImageIndex(idx);
                                  setIsAutoPlaying(false);
                                }}
                                className={`h-1 rounded-full transition-all ${
                                  idx === currentImageIndex 
                                    ? "w-4 bg-primary" 
                                    : "w-1 bg-foreground/30"
                                }`}
                                aria-label={`Ir para imagem ${idx + 1}`}
                              />
                            ))}
                          </div>

                          <div className="absolute top-2 right-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
                              {currentImageIndex + 1}/{imagens.length}
                            </span>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </div>
                );
              })()}

              {/* Info */}
              <div className="p-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {selectedProduct.preco && (
                  <motion.p
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="text-2xl font-bold text-primary mb-4"
                  >
                    {formatPrice(Number(selectedProduct.preco))}
                  </motion.p>
                )}
                {selectedProduct.descricao && (
                  <div>
                    <h3 className="text-xs font-semibold text-foreground/80 dark:text-foreground/70 mb-2">Descrição</h3>
                    <p className="text-sm text-foreground/70 dark:text-foreground/60 leading-relaxed whitespace-pre-wrap">
                      {selectedProduct.descricao}
                    </p>
                  </div>
                )}
              </div>

              {/* Botão WhatsApp destacado */}
              <div className="p-4 border-t border-foreground/[0.03] dark:border-foreground/[0.08] flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleWhatsAppClick(selectedProduct)}
                  className="w-full bg-gradient-to-r from-[#25D366] to-[#20ba5a] hover:from-[#20ba5a] hover:to-[#1da851] text-white font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-green-500/30"
                >
                  <MessageCircle className="w-4 h-4" />
                  Falar no WhatsApp
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
