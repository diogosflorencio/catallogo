# 🔐 Como Habilitar Google Sign-In no Firebase

## Problema: Login não aparece no Firebase Console

Se você fez login mas a conta não aparece no Firebase Console, provavelmente o Google Sign-In não está habilitado ou os domínios autorizados não estão configurados.

## Passo 1: Habilitar Google Sign-In

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto (catallogo)
3. Vá em **Authentication** (Autenticação)
4. Clique na aba **Sign-in method** (Métodos de login)
5. Clique em **Google**
6. **Ative o toggle "Enable"** (Habilitar)
7. Configure:
   - **Project support email**: Seu email
   - **Project public-facing name**: Catallogo (ou o nome que preferir)
8. Clique em **Save** (Salvar)

## Passo 2: Configurar Domínios Autorizados

1. Ainda em **Authentication** > **Settings** (Configurações)
2. Role até a seção **Authorized domains** (Domínios autorizados)
3. Verifique se os seguintes domínios estão na lista:
   - `localhost` (para desenvolvimento local)
   - Seu domínio de produção (ex: `catallogo.vercel.app`)
4. Se `localhost` não estiver, clique em **Add domain** e adicione:
   - `localhost`
   - Clique em **Add**

## Passo 3: Verificar Configuração do App Web

1. Vá em **⚙️ Project settings** (Configurações do projeto)
2. Na aba **General**
3. Role até **Your apps**
4. Clique no app Web
5. Verifique se as configurações estão corretas:
   - **API Key**: Deve estar no `.env.local` como `NEXT_PUBLIC_FIREBASE_API_KEY`
   - **Auth Domain**: Deve estar no `.env.local` como `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - **Project ID**: Deve estar no `.env.local` como `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - **App ID**: Deve estar no `.env.local` como `NEXT_PUBLIC_FIREBASE_APP_ID`

## Passo 4: Verificar OAuth Consent Screen (Google Cloud)

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Selecione o projeto `catallogo` (ou o ID do projeto do Firebase)
3. Vá em **APIs & Services** > **OAuth consent screen**
4. Verifique se está configurado:
   - **User Type**: External (para desenvolvimento) ou Internal (para organização)
   - **App name**: Catallogo
   - **User support email**: Seu email
   - **Developer contact information**: Seu email
5. Clique em **Save and Continue**
6. Adicione scopes (se necessário):
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
7. Clique em **Save and Continue**
8. Adicione test users (se estiver em modo de teste):
   - Adicione seu email para testar
9. Clique em **Save and Continue**
10. Revise e clique em **Back to Dashboard**

## Passo 5: Verificar OAuth 2.0 Client IDs

1. No Google Cloud Console, vá em **APIs & Services** > **Credentials**
2. Procure por **OAuth 2.0 Client IDs**
3. Verifique se existe um client ID do tipo **Web application**
4. Se não existir, crie um:
   - Clique em **Create Credentials** > **OAuth client ID**
   - **Application type**: Web application
   - **Name**: Catallogo Web
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (para desenvolvimento)
     - `https://seu-dominio.vercel.app` (para produção)
   - **Authorized redirect URIs**:
     - `http://localhost:3000` (para desenvolvimento)
     - `https://seu-dominio.vercel.app` (para produção)
     - `https://catallogo.firebaseapp.com/__/auth/handler` (Firebase)
   - Clique em **Create**

## Passo 6: Testar Localmente

1. Reinicie o servidor: `npm run dev`
2. Acesse: `http://localhost:3000/perfil`
3. Clique em **Continuar com Google**
4. Você deve ser redirecionado para o Google
5. Após fazer login, você deve voltar para o app
6. Verifique no console do navegador se aparecem os logs:
   - `✅ [handleRedirectResult] Redirect result processado!`
   - `✅ [handleRedirectResult] Usuário: seu-email@gmail.com`
7. Verifique no Firebase Console > Authentication > Users se sua conta aparece

## Problemas Comuns

### Erro: "unauthorized-domain"
- **Solução**: Adicione `localhost` aos domínios autorizados no Firebase Console

### Erro: "operation-not-allowed"
- **Solução**: Habilite o Google Sign-In no Firebase Console > Authentication > Sign-in method

### Erro: "redirect-uri-mismatch"
- **Solução**: Verifique se os redirect URIs no Google Cloud Console estão corretos

### Login funciona mas usuário não aparece no Firebase Console
- **Solução**: Verifique se o Google Sign-In está habilitado no Firebase Console
- Verifique se você está olhando no projeto correto do Firebase
- Verifique se há erros no console do navegador

## Verificar se está funcionando

1. Faça login com Google
2. Vá no Firebase Console > Authentication > Users
3. Você deve ver sua conta Google listada
4. Se não aparecer, verifique os logs no console do navegador para erros

