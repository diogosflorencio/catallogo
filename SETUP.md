# 🚀 Guia de Setup Completo - Catallogo

## 📋 Checklist de Configuração

### 1. Firebase (Apenas Autenticação)

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative **Authentication**:
   - Vá em Authentication > Sign-in method
   - Ative **Google** como provedor
   - Configure o email de suporte
4. Copie as credenciais:
   - Vá em Project Settings > General
   - Copie: API Key, Auth Domain, Project ID, Messaging Sender ID, App ID

**⚠️ NÃO precisa de:**
- Firestore
- Storage
- Functions
- Hosting

### 2. Supabase (Banco de Dados + Storage)

1. Acesse [Supabase](https://supabase.com/)
2. Crie um novo projeto
3. **Crie o bucket de Storage:**
   - Vá em Storage (menu lateral)
   - Clique em "New bucket"
   - Nome: `produtos`
   - Marque como **Público** (Public bucket)
   - Clique em "Create bucket"

4. **Configure as políticas do bucket:**
   - Vá em Storage > produtos > Policies
   - Clique em "New Policy"
   - Selecione "For full customization"
   - Cole a política abaixo:
   ```sql
   -- Política para permitir upload público
   CREATE POLICY "Permitir upload público" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'produtos');
   
   -- Política para permitir leitura pública
   CREATE POLICY "Permitir leitura pública" ON storage.objects
   FOR SELECT USING (bucket_id = 'produtos');
   
   -- Política para permitir deleção (apenas do próprio arquivo)
   CREATE POLICY "Permitir deleção" ON storage.objects
   FOR DELETE USING (bucket_id = 'produtos');
   ```
   - Ou use a interface visual para criar políticas que permitam:
     - SELECT (leitura) para todos
     - INSERT (upload) para usuários autenticados
     - DELETE (deleção) para usuários autenticados

5. **Execute o schema SQL:**
   - Vá em SQL Editor
   - Clique em "New query"
   - Cole o conteúdo do arquivo `supabase-schema.sql`
   - Clique em "Run" ou pressione Ctrl+Enter

6. **Copie as credenciais:**
   - Vá em Settings > API
   - Copie:
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (mantenha secreto!)

### 3. Stripe (Pagamentos)

1. Acesse [Stripe](https://stripe.com/)
2. Crie uma conta
3. Vá em Developers > API keys
4. Copie:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`

5. **Configure Webhooks:**
   - Vá em Developers > Webhooks
   - Clique em "Add endpoint"
   - URL: `https://seu-dominio.vercel.app/api/stripe/webhook`
   - Eventos a escutar:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copie o Signing secret → `STRIPE_WEBHOOK_SECRET`

### 4. Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
# Firebase (apenas Auth)
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id

# Supabase (banco + storage)
NEXT_PUBLIC_SUPABASE_URL=https://seu_projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=sua_publishable_key
STRIPE_SECRET_KEY=sua_secret_key
STRIPE_WEBHOOK_SECRET=seu_webhook_secret
```

### 5. Testar Localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

### 6. Deploy na Vercel

1. Instale a CLI:
```bash
npm i -g vercel
```

2. Faça login:
```bash
vercel login
```

3. Configure as variáveis de ambiente na Vercel:
   - Acesse: https://vercel.com/dashboard
   - Vá em seu projeto > Settings > Environment Variables
   - Adicione todas as variáveis do `.env.local`

4. Deploy:
```bash
vercel --prod
```

Ou conecte seu repositório Git para deploy automático.

## ✅ Verificação Final

- [ ] Firebase Auth configurado e funcionando
- [ ] Supabase com bucket `produtos` criado
- [ ] Schema SQL executado no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Stripe webhook configurado
- [ ] Aplicação rodando localmente
- [ ] Deploy na Vercel concluído

## 🆘 Problemas Comuns

### Erro ao fazer upload de imagens
- Verifique se o bucket `produtos` foi criado no Supabase
- Verifique se o bucket está marcado como público
- Verifique as variáveis de ambiente do Supabase

### Erro de autenticação
- Verifique se o Google Sign-In está ativado no Firebase
- Verifique as variáveis de ambiente do Firebase

### Erro ao acessar banco de dados
- Verifique se o schema SQL foi executado
- Verifique as variáveis de ambiente do Supabase
- Verifique as políticas RLS no Supabase

