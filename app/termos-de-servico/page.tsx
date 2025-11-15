"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function TermosDeServicoPage() {
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
              Termos de Serviço
            </h1>
            <p className="text-sm text-foreground/60 text-center">
              Última atualização: {new Date().toLocaleDateString("pt-BR")}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none text-foreground/80 space-y-6">
            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                1. Aceitação dos Termos
              </h2>
              <p className="leading-relaxed">
                Ao acessar e usar o Catallogo, você concorda em cumprir e estar vinculado a estes Termos de Serviço. 
                Se você não concorda com qualquer parte destes termos, não deve usar nosso serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                2. Descrição do Serviço
              </h2>
              <p className="leading-relaxed">
                O Catallogo é uma plataforma SaaS que permite aos usuários criar, gerenciar e compartilhar catálogos 
                de produtos online. Oferecemos planos gratuitos e pagos com diferentes funcionalidades e limites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                3. Conta do Usuário
              </h2>
              <p className="leading-relaxed mb-3">
                Para usar o Catallogo, você precisa criar uma conta. Você é responsável por:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Manter a segurança de sua conta e senha</li>
                <li>Fornecer informações precisas e atualizadas</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
                <li>Ser responsável por todas as atividades que ocorrem sob sua conta</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                4. Uso Aceitável
              </h2>
              <p className="leading-relaxed mb-3">
                Você concorda em NÃO usar o Catallogo para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Publicar conteúdo ilegal, ofensivo, difamatório ou que viole direitos de terceiros</li>
                <li>Vender produtos proibidos por lei ou que violem direitos de propriedade intelectual</li>
                <li>Enviar spam, mensagens não solicitadas ou conteúdo malicioso</li>
                <li>Tentar acessar áreas restritas do sistema ou interferir no funcionamento do serviço</li>
                <li>Usar o serviço para atividades fraudulentas ou enganosas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                5. Conteúdo do Usuário
              </h2>
              <p className="leading-relaxed mb-3">
                Você mantém todos os direitos sobre o conteúdo que publica no Catallogo. Ao publicar conteúdo, você:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Garante que possui todos os direitos necessários sobre o conteúdo</li>
                <li>Concede ao Catallogo uma licença não exclusiva para exibir e distribuir seu conteúdo através da plataforma</li>
                <li>Autoriza o Catallogo a usar, modificar e exibir seu conteúdo conforme necessário para fornecer o serviço</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                6. Planos e Pagamentos
              </h2>
              <p className="leading-relaxed mb-3">
                O Catallogo oferece planos gratuitos e pagos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Planos pagos são cobrados mensalmente ou anualmente conforme o plano escolhido</li>
                <li>Os pagamentos são processados através de serviços de terceiros (Stripe)</li>
                <li>Você pode cancelar sua assinatura a qualquer momento</li>
                <li>Não oferecemos reembolsos para períodos já pagos, exceto conforme exigido por lei</li>
                <li>Reservamo-nos o direito de modificar os preços com aviso prévio de 30 dias</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                7. Propriedade Intelectual
              </h2>
              <p className="leading-relaxed">
                O Catallogo e todo o seu conteúdo, incluindo mas não limitado a design, logotipos, textos, gráficos e software, 
                são propriedade do Catallogo ou de seus licenciadores e estão protegidos por leis de propriedade intelectual. 
                Você não pode copiar, modificar, distribuir ou criar trabalhos derivados sem nossa autorização prévia por escrito.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                8. Limitação de Responsabilidade
              </h2>
              <p className="leading-relaxed mb-3">
                O Catallogo é fornecido "como está" e "conforme disponível". Não garantimos que:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>O serviço será ininterrupto, seguro ou livre de erros</li>
                <li>Os resultados obtidos do uso do serviço serão precisos ou confiáveis</li>
                <li>Qualquer defeito ou erro será corrigido</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Em nenhuma circunstância seremos responsáveis por danos indiretos, incidentais, especiais ou consequenciais 
                resultantes do uso ou incapacidade de usar o serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                9. Modificações do Serviço
              </h2>
              <p className="leading-relaxed">
                Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer aspecto do serviço a qualquer momento, 
                com ou sem aviso prévio. Não seremos responsáveis perante você ou terceiros por qualquer modificação, suspensão 
                ou descontinuação do serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                10. Rescisão
              </h2>
              <p className="leading-relaxed">
                Podemos encerrar ou suspender sua conta e acesso ao serviço imediatamente, sem aviso prévio, por qualquer motivo, 
                incluindo se você violar estes Termos de Serviço. Após a rescisão, seu direito de usar o serviço cessará imediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                11. Lei Aplicável
              </h2>
              <p className="leading-relaxed">
                Estes Termos de Serviço são regidos pelas leis do Brasil. Qualquer disputa relacionada a estes termos será 
                resolvida nos tribunais competentes do Brasil.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                12. Alterações nos Termos
              </h2>
              <p className="leading-relaxed">
                Reservamo-nos o direito de modificar estes Termos de Serviço a qualquer momento. As alterações entrarão em vigor 
                imediatamente após a publicação. É sua responsabilidade revisar periodicamente estes termos. O uso continuado do 
                serviço após as alterações constitui sua aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold mb-4 text-foreground">
                13. Contato
              </h2>
              <p className="leading-relaxed">
                Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco através dos canais de suporte 
                disponíveis na plataforma.
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

