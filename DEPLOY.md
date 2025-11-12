# 🚀 Guia de Deploy - Catallogo

## ⚠️ Importante: Firebase Hosting e Next.js

O **Firebase Hosting é estático** e **não executa Node.js**. Como seu projeto Next.js tem **API Routes** (`/api/stripe/*`), você precisa de uma das seguintes soluções:

---

## ✅ Opção 1: Vercel (RECOMENDADO - Mais Fácil)

A Vercel é otimizada para Next.js e suporta tudo automaticamente:

### Deploy na Vercel:

1. **Instale a CLI da Vercel:**
```bash
npm i -g vercel
```

2. **Faça login:**
```bash
vercel login
```

3. **Configure as variáveis de ambiente:**
   - Acesse: https://vercel.com/dashboard
   - Vá em Settings > Environment Variables
   - Adicione todas as variáveis do `.env.local`

4. **Deploy:**
```bash
vercel --prod
```

**Vantagens:**
- ✅ Funciona automaticamente com Next.js
- ✅ API Routes funcionam nativamente
- ✅ SSR e SSG funcionam
- ✅ Deploy automático via Git
- ✅ CDN global
- ✅ Grátis para projetos pessoais

---

## ⚙️ Opção 2: Firebase Hosting + Cloud Functions

Para usar Firebase Hosting, você precisa:

### 2.1. Exportar como estático (SEM API Routes)

**Limitação:** As rotas `/api/stripe/*` não funcionarão.

```bash
# next.config.ts precisa ter:
output: 'export'
```

**Não recomendado** para este projeto porque você precisa das API Routes do Stripe.

### 2.2. Usar Firebase Functions para API Routes

Você precisaria mover as API Routes para Firebase Functions:

1. **Criar estrutura de Functions:**
```bash
mkdir functions
cd functions
npm init -y
npm install next firebase-functions
```

2. **Mover API Routes para Functions:**
   - Criar endpoints HTTP nas Functions
   - Configurar rewrites no `firebase.json`

**Complexidade:** Alta - requer refatoração significativa.

---

## 🎯 Opção 3: Firebase Hosting (Estático) + API Routes em outro lugar

Você pode:
- **Frontend:** Firebase Hosting (export estático)
- **API Routes:** Firebase Functions ou outro serviço

Mas isso requer separar o código.

---

## 📋 Checklist de Deploy

### Antes de fazer deploy:

- [ ] Configurar variáveis de ambiente no serviço de hospedagem
- [ ] Configurar domínio customizado (se necessário)
- [ ] Testar build local: `npm run build`
- [ ] Verificar se todas as dependências estão no `package.json`
- [ ] Configurar Firebase Auth, Firestore, Storage
- [ ] Configurar Supabase (se usar analytics)
- [ ] Configurar Stripe webhooks

### Variáveis de ambiente necessárias:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 🏆 Recomendação Final

**Use Vercel** para este projeto porque:
1. ✅ Suporta Next.js completo nativamente
2. ✅ API Routes funcionam automaticamente
3. ✅ Configuração simples
4. ✅ Deploy rápido
5. ✅ Grátis para projetos pessoais

**Firebase Hosting** use apenas se:
- Você já tem tudo configurado no Firebase
- Está disposto a refatorar para usar Functions
- Precisa usar especificamente Firebase Hosting

---

## 🔧 Build Local (Teste)

Antes de fazer deploy, teste o build:

```bash
npm run build
npm start
```

Se funcionar localmente, funcionará na Vercel.

