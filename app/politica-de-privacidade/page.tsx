"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function PoliticaDePrivacidadePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background-alt rounded-2xl p-8 md:p-12 shadow-lg border border-blush/10"
        >
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-4xl font-display font-semibold text-center mb-4">
              Política de Privacidade
            </h1>
            <p className="text-sm text-foreground/60 text-center">
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none text-foreground/80 space-y-6">
            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                1. Introdução
              </h2>
              <p className="leading-relaxed">
                O Catallogo ("nós", "nosso" ou "plataforma") está comprometido em proteger sua privacidade. Esta Política de 
                Privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações pessoais quando você 
                usa nosso serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                2. Informações que Coletamos
              </h2>
              <p className="leading-relaxed mb-3">
                Coletamos os seguintes tipos de informações:
              </p>
              
              <h3 className="text-xl font-display font-semibold mb-3 mt-4 text-foreground">
                2.1. Informações Fornecidas por Você
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Nome, endereço de e-mail e foto de perfil (através do login com Google)</li>
                <li>Nome da loja, username e número de WhatsApp</li>
                <li>Informações de pagamento (processadas através do Stripe, não armazenamos dados de cartão)</li>
                <li>Conteúdo que você publica, incluindo produtos, catálogos e imagens</li>
              </ul>

              <h3 className="text-xl font-display font-semibold mb-3 mt-4 text-foreground">
                2.2. Informações Coletadas Automaticamente
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Dados de uso da plataforma (páginas visitadas, tempo de permanência)</li>
                <li>Informações do dispositivo (tipo, sistema operacional, navegador)</li>
                <li>Endereço IP e localização aproximada</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                3. Como Usamos Suas Informações
              </h2>
              <p className="leading-relaxed mb-3">
                Usamos suas informações para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fornecer, manter e melhorar nossos serviços</li>
                <li>Processar transações e gerenciar sua conta</li>
                <li>Enviar notificações sobre sua conta e serviços</li>
                <li>Personalizar sua experiência na plataforma</li>
                <li>Analisar o uso da plataforma e melhorar nossos serviços</li>
                <li>Detectar, prevenir e resolver problemas técnicos e de segurança</li>
                <li>Cumprir obrigações legais e proteger nossos direitos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                4. Compartilhamento de Informações
              </h2>
              <p className="leading-relaxed mb-3">
                Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas nas seguintes situações:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Prestadores de Serviços:</strong> Compartilhamos com provedores de serviços terceirizados que nos 
                  ajudam a operar a plataforma (como Stripe para pagamentos, Supabase para armazenamento de dados)
                </li>
                <li>
                  <strong>Conteúdo Público:</strong> Informações que você torna públicas (como produtos em catálogos públicos) 
                  são visíveis para qualquer pessoa na internet
                </li>
                <li>
                  <strong>Obrigações Legais:</strong> Quando exigido por lei, ordem judicial ou processo legal
                </li>
                <li>
                  <strong>Proteção de Direitos:</strong> Para proteger nossos direitos, propriedade ou segurança, ou de nossos 
                  usuários
                </li>
                <li>
                  <strong>Com seu Consentimento:</strong> Em outras situações com seu consentimento explícito
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                5. Cookies e Tecnologias Similares
              </h2>
              <p className="leading-relaxed">
                Usamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso da plataforma e personalizar 
                conteúdo. Você pode controlar o uso de cookies através das configurações do seu navegador, mas isso pode afetar 
                algumas funcionalidades do serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                6. Segurança dos Dados
              </h2>
              <p className="leading-relaxed">
                Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações pessoais 
                contra acesso não autorizado, alteração, divulgação ou destruição. No entanto, nenhum método de transmissão pela 
                internet ou armazenamento eletrônico é 100% seguro, e não podemos garantir segurança absoluta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                7. Seus Direitos
              </h2>
              <p className="leading-relaxed mb-3">
                De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem os seguintes direitos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Acesso:</strong> Solicitar acesso às suas informações pessoais</li>
                <li><strong>Correção:</strong> Solicitar correção de informações imprecisas ou incompletas</li>
                <li><strong>Exclusão:</strong> Solicitar a exclusão de suas informações pessoais</li>
                <li><strong>Portabilidade:</strong> Solicitar a portabilidade de seus dados</li>
                <li><strong>Revogação:</strong> Revogar seu consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> Opor-se ao processamento de suas informações pessoais</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Para exercer esses direitos, entre em contato conosco através dos canais de suporte disponíveis na plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                8. Retenção de Dados
              </h2>
              <p className="leading-relaxed">
                Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta política, 
                a menos que um período de retenção mais longo seja exigido ou permitido por lei. Quando você exclui sua conta, 
                excluímos ou anonimizamos suas informações pessoais, exceto quando a retenção for necessária para cumprir obrigações 
                legais ou resolver disputas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                9. Privacidade de Menores
              </h2>
              <p className="leading-relaxed">
                O Catallogo não é direcionado a menores de 18 anos. Não coletamos intencionalmente informações pessoais de menores. 
                Se tomarmos conhecimento de que coletamos informações de um menor sem o consentimento dos pais, tomaremos medidas 
                para excluir essas informações.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                10. Transferência Internacional de Dados
              </h2>
              <p className="leading-relaxed">
                Suas informações podem ser transferidas e processadas em países diferentes do seu país de residência. Ao usar nosso 
                serviço, você consente com a transferência de suas informações para esses países. Garantimos que essas transferências 
                sejam feitas de acordo com as leis de proteção de dados aplicáveis.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                11. Alterações nesta Política
              </h2>
              <p className="leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas 
                publicando a nova política nesta página e atualizando a data de "Última atualização". Recomendamos que você revise 
                esta política periodicamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                12. Contato
              </h2>
              <p className="leading-relaxed">
                Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política de Privacidade ou ao tratamento 
                de suas informações pessoais, entre em contato conosco através dos canais de suporte disponíveis na plataforma.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-blush/20 text-center">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

