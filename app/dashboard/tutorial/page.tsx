"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { UserProfile } from "@/lib/supabase/database";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Loading } from "@/components/ui/Loading";
import { motion } from "framer-motion";
import { BookOpen, Plus, ShoppingBag, User, Link2, Image, Share2, MessageCircle } from "lucide-react";

export default function TutorialPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/perfil");
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  async function loadData() {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userProfile = await response.json();
        setProfile(userProfile);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return <Loading message="Carregando tutorial..." fullScreen />;
  }

  if (!user) {
    return <Loading message="Redirecionando para login..." fullScreen />;
  }

  if (!profile) {
    return <Loading message="Carregando dados..." fullScreen />;
  }

  const sections = [
    {
      icon: User,
      title: "1. Criando seu Perfil",
      content: [
        "Acesse a página 'Conta' no menu de navegação",
        "Preencha o nome da sua loja",
        "Escolha um username único (será usado no seu link público)",
        "Adicione seu número do WhatsApp",
        "Personalize a mensagem que será enviada quando alguém clicar em 'Falar no WhatsApp'",
        "Faça upload de uma foto de perfil personalizada (opcional)",
        "Escolha o tema da sua página (claro, escuro ou seguir preferência do sistema)",
      ],
      imagePlaceholder: "📸 [Espaço para imagem/GIF: Tela de configuração de perfil]",
    },
    {
      icon: ShoppingBag,
      title: "2. Criando Catálogos",
      content: [
        "Vá para a página 'Catálogos'",
        "Clique em 'Novo Catálogo'",
        "Preencha o nome do catálogo",
        "Adicione uma descrição (opcional)",
        "Escolha se o catálogo será público ou privado",
        "Público: visível para qualquer pessoa com o link",
        "Privado: apenas você pode ver e editar",
      ],
      imagePlaceholder: "📸 [Espaço para imagem/GIF: Criando um catálogo]",
    },
    {
      icon: Plus,
      title: "3. Adicionando Produtos",
      content: [
        "Acesse um catálogo e clique em 'Novo Produto'",
        "Adicione até 3 imagens do produto (recomendamos imagens quadradas)",
        "Preencha o nome do produto",
        "Adicione uma descrição detalhada (opcional)",
        "Defina o preço (opcional)",
        "Escolha se o produto será visível no catálogo público ou oculto",
        "Salve o produto",
      ],
      imagePlaceholder: "📸 [Espaço para imagem/GIF: Adicionando produtos]",
    },
    {
      icon: Image,
      title: "4. Dicas de Imagens",
      content: [
        "Use imagens quadradas para melhor visualização",
        "As imagens são automaticamente comprimidas para otimizar o carregamento",
        "Você pode adicionar até 3 imagens por produto",
        "A primeira imagem será exibida no grid de produtos",
        "No modal do produto, todas as imagens podem ser visualizadas em um carrossel",
      ],
      imagePlaceholder: "📸 [Espaço para imagem/GIF: Exemplo de produtos com imagens]",
    },
    {
      icon: Link2,
      title: "5. Compartilhando seus Catálogos",
      content: [
        "Cada usuário tem um link único: seu-site.com/seu-username",
        "Cada catálogo tem seu próprio link: seu-site.com/seu-username/nome-do-catalogo",
        "Você pode compartilhar o link do perfil (mostra todos os catálogos públicos)",
        "Ou compartilhar o link de um catálogo específico",
        "Os links estão disponíveis na página 'Home' do dashboard",
        "Copie e compartilhe onde quiser: Instagram, WhatsApp, email, etc.",
      ],
      imagePlaceholder: "📸 [Espaço para imagem/GIF: Links de compartilhamento]",
    },
    {
      icon: Share2,
      title: "6. Visualização Pública",
      content: [
        "Quando alguém acessa seu link público, vê:",
        "Sua foto de perfil personalizada e nome da loja",
        "Todos os seus catálogos públicos",
        "Os produtos visíveis de cada catálogo em um grid organizado",
        "Ao clicar em um produto, abre um modal com:",
        "Carrossel de imagens (se houver múltiplas)",
        "Descrição completa",
        "Preço",
        "Botão para falar no WhatsApp",
      ],
      imagePlaceholder: "📸 [Espaço para imagem/GIF: Visualização pública do catálogo]",
    },
    {
      icon: MessageCircle,
      title: "7. Integração com WhatsApp",
      content: [
        "Configure sua mensagem template na página 'Conta'",
        "Use {{produtoNome}} para incluir automaticamente o nome do produto",
        "Quando um cliente clica em 'Falar no WhatsApp':",
        "O WhatsApp Web/App abre automaticamente",
        "A mensagem já vem pré-preenchida",
        "O cliente só precisa enviar",
      ],
      imagePlaceholder: "📸 [Espaço para imagem/GIF: Fluxo do WhatsApp]",
    },
    {
      icon: BookOpen,
      title: "8. Gerenciando seus Conteúdos",
      content: [
        "Edite produtos a qualquer momento - você pode substituir imagens (as antigas são removidas automaticamente)",
        "Altere a visibilidade dos catálogos (público/privado)",
        "Altere a visibilidade de cada produto individualmente (visível ou oculto)",
        "Exclua produtos ou catálogos quando necessário",
        "Todos os catálogos aparecem no seu dashboard, mesmo os privados",
        "Apenas catálogos públicos e produtos visíveis são mostrados para visitantes",
        "Você pode ter quantos catálogos e produtos quiser (conforme seu plano)",
        "Na página de gerenciar produtos, você vê o status de visibilidade de cada item",
      ],
      imagePlaceholder: "📸 [Espaço para imagem/GIF: Gerenciamento de conteúdo]",
    },
  ];

  return (
    <ThemeProvider userProfile={profile} isLandingPage={false}>
      <DashboardLayout profile={profile}>
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 md:mb-8"
          >
            <h1 className="text-2xl md:text-4xl font-display font-bold mb-2 md:mb-4">
              Aprenda rapidamente tudo sobre o app
            </h1>
            <p className="text-foreground/70 text-base md:text-lg">
              Guia completo para usar todas as funcionalidades do Catallogo
            </p>
          </motion.div>

          <div className="space-y-6 md:space-y-8">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background-alt rounded-xl p-4 md:p-6"
                >
                  <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4 mb-4">
                    <div className="bg-primary/20 p-2 md:p-3 rounded-lg flex-shrink-0">
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl md:text-2xl font-display font-semibold mb-3 md:mb-4">
                        {section.title}
                      </h2>
                      
                      {/* Espaço para imagem/GIF */}
                      <div className="bg-background rounded-lg p-4 md:p-8 mb-3 md:mb-4 border-2 border-dashed border-blush/30 text-center text-foreground/50 text-sm md:text-base">
                        {section.imagePlaceholder}
                      </div>

                      <ul className="space-y-1.5 md:space-y-2">
                        {section.content.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5 md:mt-1 flex-shrink-0">•</span>
                            <span className="text-foreground/80 text-sm md:text-base">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 md:mt-12 bg-primary/10 rounded-xl p-4 md:p-6 text-center"
          >
            <h3 className="text-lg md:text-xl font-display font-semibold mb-2">
              Pronto para começar?
            </h3>
            <p className="text-foreground/70 mb-4 text-sm md:text-base">
              Agora que você conhece todas as funcionalidades, crie seu primeiro catálogo!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/dashboard/catalogos/novo"
                className="px-4 md:px-6 py-2 bg-primary text-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm md:text-base"
              >
                Criar Catálogo
              </a>
              <a
                href="/dashboard"
                className="px-4 md:px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-medium text-sm md:text-base"
              >
                Voltar ao Dashboard
              </a>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    </ThemeProvider>
  );
}

