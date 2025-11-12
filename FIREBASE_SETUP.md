# 🔥 Como Configurar o Firebase para Login

## Passo 1: Acessar o Firebase Console

1. Acesse: https://console.firebase.google.com
2. Selecione seu projeto (ou crie um novo)

## Passo 2: Encontrar as Configurações do Projeto

### Opção A: Pela Página Inicial do Projeto

1. No Firebase Console, clique no **ícone de engrenagem (⚙️)** ao lado de "Project Overview"
2. Selecione **"Project settings"** (Configurações do projeto)
3. Role até a seção **"Your apps"** (Seus apps)
4. Se você já tem um app Web, clique nele
5. Se não tem, clique em **"Add app"** → **"Web"** (ícone `</>`)
   - Dê um nome para o app (ex: "Catallogo Web")
   - Marque a opção "Also set up Firebase Hosting" (opcional)
   - Clique em "Register app"

### Opção B: Direto nas Configurações

1. Vá em **⚙️ Project settings**
2. Na aba **"General"**
3. Role até **"Your apps"**
4. Clique no app Web ou crie um novo

## Passo 3: Copiar as Configurações

Depois de criar/selecionar o app Web, você verá algo assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## Passo 4: Adicionar ao .env.local

Abra o arquivo `.env.local` na raiz do projeto e adicione:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**Substitua os valores pelos que você copiou do Firebase Console!**

## Passo 5: Habilitar Google Sign-In

1. No Firebase Console, vá em **"Authentication"** (Autenticação)
2. Clique na aba **"Sign-in method"** (Métodos de login)
3. Clique em **"Google"**
4. Ative o toggle **"Enable"**
5. Selecione um **Project support email**
6. Clique em **"Save"**

## Passo 6: Configurar Domínios Autorizados (Opcional)

Se você vai testar em localhost:
1. Em **Authentication** → **Settings** → **Authorized domains**
2. Certifique-se que `localhost` está na lista (já vem por padrão)

## Passo 7: Reiniciar o Servidor

Depois de adicionar as variáveis no `.env.local`:

```bash
npm run dev
```

## ✅ Verificação

Se tudo estiver correto:
- O login com Google deve aparecer na página inicial
- Ao clicar, deve abrir o popup de login do Google
- Após login, você será redirecionado para o onboarding

## 🐛 Problemas Comuns

**Erro: "Firebase não está configurado"**
- Verifique se todas as variáveis estão no `.env.local`
- Reinicie o servidor (`npm run dev`)
- Verifique se não há espaços extras nas variáveis

**Erro: "auth/invalid-api-key"**
- Verifique se copiou a API Key correta
- Certifique-se que não há aspas nas variáveis do `.env.local`

**Popup não abre**
- Verifique se o Google Sign-In está habilitado no Firebase
- Verifique se o domínio está autorizado

