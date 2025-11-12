# Catallogo

SaaS para criação e compartilhamento de catálogos de produtos.

## 🚀 Tecnologias

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Autenticação**: Firebase Auth (Google Sign-In)
- **Banco de Dados**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (imagens)
- **Analytics**: Supabase
- **Pagamentos**: Stripe
- **Hosting**: Vercel
- **Animações**: Framer Motion
- **Gráficos**: Recharts

## 📋 Pré-requisitos

- Node.js 20+
- Conta Firebase (apenas para Auth e Storage)
- Conta Supabase (banco de dados)
- Conta Stripe (para pagamentos)
- Conta Vercel (para hosting)

## 🔧 Configuração

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.local.example .env.local
```

Preencha as variáveis no arquivo `.env.local`:
- **Firebase**: API Key, Auth Domain, Project ID (apenas para Auth)
- **Supabase**: URL, Anon Key e Service Role Key (banco de dados e storage)
- **Stripe**: Publishable Key e Secret Key

4. Configure o Supabase:
   - Execute o script `supabase-schema.sql` no SQL Editor do Supabase
   - Isso criará todas as tabelas necessárias

5. Execute o projeto em desenvolvimento:
```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
├── app/                    # Páginas Next.js (App Router)
│   ├── [username]/        # Páginas públicas
│   ├── u/[username]/      # Dashboard do usuário
│   └── api/               # API Routes
├── components/            # Componentes React
│   ├── dashboard/         # Componentes do dashboard
│   ├── catalogo/          # Componentes de catálogo
│   └── ui/                # Componentes UI reutilizáveis
├── lib/                   # Utilitários e configurações
│   ├── firebase/          # Firebase Auth e Storage
│   ├── supabase/          # Supabase (banco de dados)
│   └── stripe/            # Configuração Stripe
└── public/                # Arquivos estáticos
```

## 🔥 Firebase Setup

1. Crie um projeto no Firebase Console
2. Ative apenas:
   - **Authentication** (Google Sign-In)

**Não precisa** de Firestore, Storage ou Functions.

## 🗄️ Supabase Setup

1. Crie um projeto no Supabase

2. **Crie o bucket de Storage:**
   - Vá em Storage > Create a new bucket
   - Nome: `produtos`
   - Público: Sim (para permitir acesso às imagens)
   - Crie o bucket

3. **Configure as políticas do bucket:**
   - Vá em Storage > produtos > Policies
   - Crie políticas que permitam:
     - SELECT (leitura) para todos
     - INSERT (upload) para usuários autenticados
     - DELETE (deleção) para usuários autenticados

4. **Execute o script `supabase-schema.sql` no SQL Editor:**
   - Vá em SQL Editor > New Query
   - Cole o conteúdo de `supabase-schema.sql`
   - Execute

Isso criará:
- Tabela `users`
- Tabela `catalogos`
- Tabela `produtos`
- Tabela `analytics_events`
- Índices e políticas RLS

5. **Configure as variáveis de ambiente:**
   - `NEXT_PUBLIC_SUPABASE_URL`: URL do seu projeto
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima (pública)
   - `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço (privada, apenas server-side)

## 💳 Stripe Setup

1. Crie uma conta no Stripe
2. Configure os webhooks:
   - URL: `https://seu-dominio.vercel.app/api/stripe/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## 🚀 Deploy na Vercel

### 1. Instale a CLI da Vercel:
```bash
npm i -g vercel
```

### 2. Faça login:
```bash
vercel login
```

### 3. Configure as variáveis de ambiente:
   - Acesse: https://vercel.com/dashboard
   - Vá em Settings > Environment Variables
   - Adicione todas as variáveis do `.env.local`

### 4. Deploy:
```bash
vercel --prod
```

Ou conecte seu repositório Git para deploy automático.

## 📝 Licença

MIT
