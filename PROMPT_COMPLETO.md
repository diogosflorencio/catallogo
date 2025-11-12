# 🪶 Catallogo - Prompt Completo do Projeto

## 📋 Resumo do Produto

**Catallogo** é um SaaS que permite a pequenos comércios e empreendedores criarem catálogos públicos de produtos para divulgar em suas bios e sites.

Cada usuário possui uma URL pública do tipo:
```
https://catallogo.web.app/:username/:catalogSlug
```

Cada produto exibe um botão "Falar no WhatsApp", que abre o chat com o número do lojista e já pré-preenche uma mensagem personalizada.

A autenticação é feita exclusivamente com **Google Sign-In via Firebase Auth** — se o usuário não existir, sua conta é criada automaticamente no Supabase.

---

## 🏗️ Arquitetura Atual

### Frontend
- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5
- **Estilização**: Tailwind CSS 3 + CSS Custom Properties
- **Animações**: Framer Motion
- **Gráficos**: Recharts
- **UI Components**: Componentes customizados (Button, Input, Textarea)
- **Ícones**: Lucide React
- **Upload**: React Dropzone

### Backend & Infraestrutura
- **Autenticação**: Firebase Auth (Google Sign-In only)
- **Banco de Dados**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (bucket `produtos`)
- **Analytics**: Supabase (tabela `analytics_events`)
- **Pagamentos**: Stripe (Checkout + Webhooks)
- **Hosting**: Vercel
- **Deploy**: Vercel CLI ou Git integration

### Design System
- **Paleta de Cores**:
  - Blush: `#F6D1D1`
  - Pêssego: `#FFD7B5`
  - Lavanda: `#9F8DAF`
  - Fundo: `#FFFFFF` / `#FCFBFB`
  - Texto: `#222222`
- **Tipografia**:
  - Primária: Inter (300, 400, 500, 600, 700)
  - Títulos: Poppins (400, 500, 600, 700)
- **Estilo**: Mobile-first, clean, feminino e suave
- **Inspiração**: Linktree + Notion + Shopify minimal

---

## 📊 Estrutura de Dados (Supabase)

### Tabela: `users`
```sql
- id (TEXT, PRIMARY KEY) - Firebase UID
- email (TEXT, NOT NULL)
- display_name (TEXT)
- photo_url (TEXT)
- username (TEXT, UNIQUE)
- nome_loja (TEXT)
- plano (TEXT) - 'free' | 'pro' | 'premium'
- whatsapp_number (TEXT)
- mensagem_template (TEXT) - Default: "Olá! Vi o produto {{produtoNome}} no seu Catallogo 💖"
- created_at (TIMESTAMP)
- last_active_at (TIMESTAMP)
```

### Tabela: `catalogos`
```sql
- id (UUID, PRIMARY KEY)
- user_id (TEXT, FOREIGN KEY -> users.id)
- slug (TEXT, NOT NULL)
- nome (TEXT, NOT NULL)
- descricao (TEXT)
- public (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(user_id, slug)
```

### Tabela: `produtos`
```sql
- id (UUID, PRIMARY KEY)
- catalogo_id (UUID, FOREIGN KEY -> catalogos.id)
- slug (TEXT, NOT NULL)
- nome (TEXT, NOT NULL)
- descricao (TEXT)
- preco (DECIMAL(10, 2))
- imagem_url (TEXT) - URL do Supabase Storage
- link_externo (TEXT)
- visivel (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(catalogo_id, slug)
```

### Tabela: `analytics_events`
```sql
- id (UUID, PRIMARY KEY)
- type (TEXT) - 'view' | 'whatsapp_click'
- username (TEXT, NOT NULL)
- catalog_slug (TEXT, NOT NULL)
- produto_id (UUID, FOREIGN KEY -> produtos.id, NULLABLE)
- timestamp (TIMESTAMP)
```

### Storage: Supabase Bucket `produtos`
- **Tipo**: Público
- **Políticas**:
  - SELECT (leitura) para todos
  - INSERT (upload) para usuários autenticados
  - DELETE (deleção) para usuários autenticados

---

## ✅ Funcionalidades Implementadas

### 1. Autenticação
- ✅ Login com Google via Firebase Auth
- ✅ Criação automática de perfil no Supabase após primeiro login
- ✅ Persistência de sessão
- ✅ Logout
- ✅ Proteção de rotas (redirecionamento se não autenticado)

### 2. Onboarding
- ✅ Fluxo de 3 passos:
  1. Nome da Loja
  2. Escolha de Username (com validação de unicidade)
  3. Número do WhatsApp
- ✅ Validação de username (regex, verificação de existência)
- ✅ Redirecionamento automático para dashboard após onboarding

### 3. Dashboard do Usuário (`/u/:username/dashboard`)
- ✅ Layout responsivo com navegação mobile (bottom bar) e desktop (header)
- ✅ Página Home:
  - Cards de estatísticas (total de catálogos, plano atual, link)
  - Lista de catálogos com status público/privado
  - Botão para criar novo catálogo
- ✅ Navegação entre seções:
  - Home
  - Catálogos
  - Estatísticas
  - Conta

### 4. CRUD de Catálogos
- ✅ Listar catálogos (`/u/:username/dashboard/catalogos`)
- ✅ Criar catálogo (`/u/:username/dashboard/catalogos/novo`)
  - Nome, slug (gerado automaticamente), descrição, visibilidade
  - Validação de limite do plano
- ✅ Editar catálogo (`/u/:username/dashboard/catalogos/:id/editar`)
- ✅ Excluir catálogo (com confirmação)
- ✅ Ver catálogo público (link externo)

### 5. CRUD de Produtos
- ✅ Listar produtos (`/u/:username/dashboard/catalogos/:id/produtos`)
- ✅ Criar produto (`/u/:username/dashboard/catalogos/:id/produtos/novo`)
  - Upload de imagem (Supabase Storage)
  - Compressão automática de imagens no cliente
  - Preview antes do upload
  - Drag & drop
  - Nome, slug, descrição, preço, link externo, visibilidade
  - Validação de limite do plano
- ✅ Editar produto (`/u/:username/dashboard/catalogos/:id/produtos/:produtoId/editar`)
  - Substituição de imagem (deleta antiga, faz upload da nova)
- ✅ Excluir produto (com confirmação)

### 6. Página Pública de Catálogo (`/:username/:catalogSlug`)
- ✅ Exibição de produtos em grid responsivo
- ✅ Header com foto e nome da loja
- ✅ Descrição do catálogo
- ✅ Cards de produtos com:
  - Imagem (aspect-square)
  - Nome
  - Descrição (truncada)
  - Preço formatado (R$)
  - Botão "Falar no WhatsApp"
- ✅ Integração WhatsApp:
  - Geração de link: `https://wa.me/55{numero}?text={mensagem}`
  - Template de mensagem personalizado
  - Substituição de variáveis `{{produtoNome}}`
- ✅ SEO:
  - Metatags dinâmicas
  - Open Graph tags
  - Título e descrição personalizados

### 7. Sistema de Planos
- ✅ Três planos:
  - **Free**: 1 catálogo, 3 produtos
  - **Pro**: 1 catálogo, produtos ilimitados (R$ 29,90/mês)
  - **Premium**: Catálogos e produtos ilimitados (R$ 79,90/mês)
- ✅ Validação de limites no frontend e backend
- ✅ Funções de verificação: `canCreateCatalog()`, `canCreateProduct()`
- ✅ Exibição de plano atual no dashboard

### 8. Integração Stripe
- ✅ API Route: `/api/stripe/checkout` (cria sessão de checkout)
- ✅ API Route: `/api/stripe/webhook` (processa eventos do Stripe)
- ✅ Página de planos (`/u/:username/dashboard/conta`)
  - Exibição de planos disponíveis
  - Botão de upgrade (redireciona para Stripe Checkout)
  - Indicação de plano atual
- ✅ Webhook handlers:
  - `checkout.session.completed` → Atualiza plano do usuário
  - `customer.subscription.updated` → Atualiza plano
  - `customer.subscription.deleted` → Downgrade para free

### 9. Perfil e Configurações (`/u/:username/dashboard/conta`)
- ✅ Edição de perfil:
  - Nome da loja
  - Username (com validação de unicidade)
  - Número do WhatsApp
  - Template de mensagem WhatsApp
- ✅ Gerenciamento de planos
- ✅ Logout

### 10. Analytics Básico (`/u/:username/dashboard/estatisticas`)
- ✅ Cards de estatísticas:
  - Total de visualizações
  - Cliques no WhatsApp
  - Taxa de conversão
- ✅ Gráficos com Recharts:
  - Linha: Visualizações (7 dias)
  - Barras: Cliques por catálogo
- ✅ Tracking de eventos:
  - Visualizações de catálogo (automático na página pública)
  - Cliques no WhatsApp (automático no botão)

### 11. Upload de Imagens
- ✅ Upload para Supabase Storage (bucket `produtos`)
- ✅ Compressão automática no cliente (max 1200px, qualidade 80%)
- ✅ Preview antes do upload
- ✅ Drag & drop (desktop e mobile)
- ✅ Suporte a PNG, JPG, JPEG, WEBP
- ✅ Deleção de imagens antigas ao substituir

### 12. Design e UX
- ✅ Animações com Framer Motion
- ✅ Transições suaves
- ✅ Skeleton loaders (preparado)
- ✅ Feedback visual em ações CRUD
- ✅ Mobile-first design
- ✅ Bottom bar navigation no mobile
- ✅ Header navigation no desktop

---

## ⚠️ Funcionalidades Pendentes / Melhorias Necessárias

### 1. Validação de Limites no Backend
- ⚠️ **PENDENTE**: Criar Firebase Functions ou API Routes para validar limites do plano no backend
- ⚠️ **PENDENTE**: Middleware para verificar limites antes de criar catálogos/produtos

### 2. Webhooks Stripe Completos
- ⚠️ **PENDENTE**: Implementar lógica completa de `customer.subscription.updated`
- ⚠️ **PENDENTE**: Implementar lógica completa de `customer.subscription.deleted` (downgrade)
- ⚠️ **PENDENTE**: Tratamento de erros e retry logic

### 3. Analytics Avançado
- ⚠️ **PENDENTE**: Conectar dados reais do Supabase (atualmente usa mock data)
- ⚠️ **PENDENTE**: Filtros por período (7 dias, 30 dias, 90 dias, custom)
- ⚠️ **PENDENTE**: Export de dados
- ⚠️ **PENDENTE**: Gráficos mais detalhados (produtos mais visualizados, horários de pico)

### 4. Personalização de Tema
- ⚠️ **PENDENTE**: Interface para escolher cores (primária, secundária, acento)
- ⚠️ **PENDENTE**: Escolha de layout (grid, lista, destaque)
- ⚠️ **PENDENTE**: Salvar preferências no Supabase
- ⚠️ **PENDENTE**: Aplicar tema dinamicamente via CSS variables

### 5. SEO e Compartilhamento
- ⚠️ **PENDENTE**: Botão "Copiar link do meu catálogo"
- ⚠️ **PENDENTE**: Geração automática de imagem Open Graph (usando logo da loja)
- ⚠️ **PENDENTE**: Sitemap.xml dinâmico
- ⚠️ **PENDENTE**: Robots.txt

### 6. Notificações e Feedback
- ⚠️ **PENDENTE**: Sistema de notificações (toasts)
- ⚠️ **PENDENTE**: Feedback visual melhorado (sucesso, erro, loading)
- ⚠️ **PENDENTE**: Confirmações de ações destrutivas (modal)

### 7. Validações e Segurança
- ⚠️ **PENDENTE**: Validação de formato de número WhatsApp
- ⚠️ **PENDENTE**: Rate limiting nas API routes
- ⚠️ **PENDENTE**: Validação de tamanho máximo de upload
- ⚠️ **PENDENTE**: Sanitização de inputs

### 8. Performance
- ⚠️ **PENDENTE**: Lazy loading de imagens
- ⚠️ **PENDENTE**: Otimização de imagens (Next.js Image component)
- ⚠️ **PENDENTE**: Cache de queries do Supabase
- ⚠️ **PENDENTE**: Paginação de listas

### 9. Testes
- ⚠️ **PENDENTE**: Testes E2E com Playwright/Cypress
- ⚠️ **PENDENTE**: Testes unitários de funções críticas
- ⚠️ **PENDENTE**: Testes de integração das API routes

### 10. Documentação
- ⚠️ **PENDENTE**: Documentação de API
- ⚠️ **PENDENTE**: Guia de contribuição
- ⚠️ **PENDENTE**: Changelog

---

## 🔧 Configuração Necessária

### 1. Variáveis de Ambiente (`.env.local`)

```env
# Firebase (apenas para autenticação)
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id

# Supabase (banco de dados e storage)
NEXT_PUBLIC_SUPABASE_URL=https://seu_projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sua_publishable_key_aqui
STRIPE_SECRET_KEY=sua_secret_key_aqui
STRIPE_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

### 2. Firebase Setup
1. Criar projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ativar **Authentication**:
   - Vá em Authentication > Sign-in method
   - Ative **Google** como provedor
   - Configure email de suporte
3. **NÃO precisa de**: Firestore, Storage, Functions, Hosting
4. Copiar credenciais de Project Settings > General

### 3. Supabase Setup
1. Criar projeto no [Supabase](https://supabase.com/)
2. **Criar bucket de Storage**:
   - Vá em Storage > Create a new bucket
   - Nome: `produtos`
   - Marque como **Público**
   - Configure políticas:
     - SELECT (leitura) para todos
     - INSERT (upload) para usuários autenticados
     - DELETE (deleção) para usuários autenticados
3. **Executar schema SQL**:
   - Vá em SQL Editor > New Query
   - Cole o conteúdo de `supabase-schema.sql`
   - Execute
4. Copiar credenciais de Settings > API:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Stripe Setup
1. Criar conta no [Stripe](https://stripe.com/)
2. Obter API keys de Developers > API keys
3. **Configurar Webhooks**:
   - Vá em Developers > Webhooks
   - Add endpoint
   - URL: `https://seu-dominio.vercel.app/api/stripe/webhook`
   - Eventos:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copiar Signing secret → `STRIPE_WEBHOOK_SECRET`

### 5. Vercel Setup
1. Instalar CLI: `npm i -g vercel`
2. Login: `vercel login`
3. **Configurar variáveis de ambiente**:
   - Acesse https://vercel.com/dashboard
   - Vá em Settings > Environment Variables
   - Adicione todas as variáveis do `.env.local`
4. Deploy: `vercel --prod`
   - Ou conecte repositório Git para deploy automático

---

## 📁 Estrutura de Arquivos

```
catallogo/
├── app/                          # Next.js App Router
│   ├── [username]/              # Rotas públicas
│   │   └── [catalogSlug]/
│   │       └── page.tsx         # Página pública do catálogo
│   ├── api/                     # API Routes
│   │   └── stripe/
│   │       ├── checkout/        # Criar sessão Stripe
│   │       └── webhook/         # Processar webhooks Stripe
│   ├── onboarding/              # Onboarding de novos usuários
│   ├── u/[username]/            # Dashboard do usuário
│   │   └── dashboard/
│   │       ├── page.tsx         # Home do dashboard
│   │       ├── catalogos/       # CRUD de catálogos
│   │       ├── conta/           # Perfil e planos
│   │       └── estatisticas/    # Analytics
│   ├── globals.css              # Estilos globais + Tailwind
│   ├── layout.tsx               # Layout raiz
│   ├── page.tsx                 # Página inicial
│   └── not-found.tsx            # Página 404
├── components/
│   ├── catalogo/
│   │   └── PublicCatalogoView.tsx  # Componente da página pública
│   ├── dashboard/
│   │   ├── DashboardHome.tsx        # Home do dashboard
│   │   └── DashboardLayout.tsx      # Layout do dashboard
│   ├── providers/
│   │   └── AuthProvider.tsx        # Provider de autenticação
│   └── ui/
│       ├── Button.tsx              # Componente de botão
│       ├── Input.tsx               # Componente de input
│       └── Textarea.tsx             # Componente de textarea
├── lib/
│   ├── firebase/
│   │   ├── auth.ts                 # Funções de autenticação
│   │   ├── config.ts                # Configuração Firebase
│   │   └── plan-limits.ts           # Validação de limites de plano
│   ├── storage/
│   │   └── upload.ts                # Upload para Supabase Storage
│   ├── stripe/
│   │   └── config.ts                # Configuração Stripe + planos
│   ├── supabase/
│   │   ├── client.ts                # Cliente Supabase (client-side)
│   │   ├── database.ts              # Funções de banco de dados
│   │   └── server.ts                # Cliente Supabase (server-side)
│   └── utils.ts                     # Funções utilitárias
├── public/                        # Arquivos estáticos
├── supabase-schema.sql            # Schema SQL do Supabase
├── tailwind.config.ts             # Configuração Tailwind
├── postcss.config.mjs             # Configuração PostCSS
├── next.config.ts                 # Configuração Next.js
├── tsconfig.json                  # Configuração TypeScript
├── vercel.json                    # Configuração Vercel
└── package.json                   # Dependências
```

---

## 🚀 Checklist de Deploy

### Antes do Deploy
- [ ] Criar projeto Firebase e configurar Authentication
- [ ] Criar projeto Supabase
- [ ] Executar `supabase-schema.sql` no Supabase
- [ ] Criar bucket `produtos` no Supabase Storage
- [ ] Configurar políticas do bucket
- [ ] Criar conta Stripe
- [ ] Configurar webhooks do Stripe
- [ ] Criar arquivo `.env.local` com todas as variáveis
- [ ] Testar build local: `npm run build`
- [ ] Testar servidor local: `npm start`

### Deploy na Vercel
- [ ] Instalar Vercel CLI: `npm i -g vercel`
- [ ] Fazer login: `vercel login`
- [ ] Configurar variáveis de ambiente no dashboard da Vercel
- [ ] Fazer deploy: `vercel --prod`
- [ ] Atualizar URL do webhook Stripe com o domínio da Vercel
- [ ] Testar login com Google
- [ ] Testar criação de catálogo
- [ ] Testar upload de imagem
- [ ] Testar checkout Stripe
- [ ] Testar webhook Stripe

### Pós-Deploy
- [ ] Configurar domínio customizado (opcional)
- [ ] Configurar SSL (automático na Vercel)
- [ ] Testar todas as funcionalidades em produção
- [ ] Monitorar logs de erro
- [ ] Configurar analytics (opcional)

---

## 🐛 Problemas Conhecidos e Soluções

### 1. CSS não funciona
**Solução**: Verificar se `tailwind.config.ts` existe e está configurado corretamente. O projeto usa Tailwind CSS 3, não 4.

### 2. Firebase Auth não funciona
**Solução**: Verificar se todas as variáveis de ambiente do Firebase estão configuradas no `.env.local`. O erro aparece no console se não estiver configurado.

### 3. Supabase retorna erro
**Solução**: 
- Verificar se o schema SQL foi executado
- Verificar se as políticas RLS estão configuradas
- Verificar se o bucket `produtos` foi criado e está público

### 4. Upload de imagens falha
**Solução**:
- Verificar se o bucket `produtos` existe
- Verificar se as políticas do bucket permitem INSERT para usuários autenticados
- Verificar se `SUPABASE_SERVICE_ROLE_KEY` está configurada

### 5. Stripe checkout não funciona
**Solução**:
- Verificar se `STRIPE_SECRET_KEY` está configurada
- Verificar se a API route `/api/stripe/checkout` está acessível
- Verificar logs da Vercel para erros

---

## 📝 Notas Importantes

1. **Firebase**: Usado APENAS para autenticação. Não usa Firestore, Storage ou Functions.

2. **Supabase**: Banco de dados principal e storage de imagens. Todas as operações de dados passam pelo Supabase.

3. **Vercel**: Hosting e execução de API routes. Suporta Next.js completo nativamente.

4. **Variáveis de Ambiente**: 
   - `NEXT_PUBLIC_*` são expostas ao cliente
   - `SUPABASE_SERVICE_ROLE_KEY` e `STRIPE_SECRET_KEY` são apenas server-side

5. **Segurança**:
   - RLS (Row Level Security) configurado no Supabase
   - Validação de limites de plano no frontend (precisa backend também)
   - Webhooks do Stripe verificam assinatura

6. **Performance**:
   - Imagens comprimidas no cliente antes do upload
   - Queries do Supabase otimizadas com índices
   - Next.js Image component pode ser usado (não implementado ainda)

---

## 🎯 Próximos Passos Prioritários

1. **Completar webhooks do Stripe** (alta prioridade)
2. **Implementar validação de limites no backend** (alta prioridade)
3. **Conectar analytics real do Supabase** (média prioridade)
4. **Adicionar sistema de notificações/toasts** (média prioridade)
5. **Implementar personalização de tema** (baixa prioridade)
6. **Adicionar testes E2E** (baixa prioridade)

---

## 📚 Documentação Adicional

- **README.md**: Guia básico de setup
- **SETUP.md**: Guia detalhado de configuração
- **DEPLOY.md**: Guia de deploy
- **supabase-schema.sql**: Schema completo do banco de dados

---

**Última atualização**: 2024
**Versão**: 1.0.0
**Status**: Funcional, com melhorias pendentes


