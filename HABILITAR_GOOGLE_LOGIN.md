# 🔥 COMO HABILITAR GOOGLE SIGN-IN NO FIREBASE

## ⚠️ PROBLEMA
Se o login não funciona, é porque o **Google Sign-In não está habilitado** no Firebase Console.

## ✅ SOLUÇÃO (2 MINUTOS)

### PASSO 1: Acessar Firebase Console
1. Acesse: **https://console.firebase.google.com**
2. **Selecione** o projeto `catallogo`

### PASSO 2: Habilitar Google Sign-In
1. No menu lateral, clique em **"Authentication"** (Autenticação)
2. Clique na aba **"Sign-in method"** (Métodos de login)
3. Na lista de provedores, encontre **"Google"**
4. **CLIQUE em "Google"**

### PASSO 3: Ativar o Toggle
1. Você verá uma tela com as configurações do Google
2. **ATIVE o toggle "Enable"** (Habilitar) - é isso que falta!
3. Preencha:
   - **Project support email**: Seu email (ex: seuemail@gmail.com)
   - **Project public-facing name**: Catallogo (ou qualquer nome)
4. **CLIQUE em "Save"** (Salvar)

### PASSO 4: Verificar Domínios Autorizados
1. Ainda em **Authentication**, clique em **"Settings"** (Configurações)
2. Role até a seção **"Authorized domains"** (Domínios autorizados)
3. Verifique se **`localhost`** está na lista
4. Se não estiver:
   - Clique em **"Add domain"**
   - Digite: `localhost`
   - Clique em **"Add"**

## ✅ VERIFICAÇÃO
Após habilitar, você deve ver:
- ✅ Toggle "Enable" está **VERDE/ATIVADO**
- ✅ Project support email está preenchido
- ✅ `localhost` está nos domínios autorizados

## 🚀 TESTE
1. Acesse: **http://localhost:3000/perfil**
2. Clique em **"Continuar com Google"**
3. Abra o console (F12) e veja os logs
4. Você deve ser redirecionado para o Google
5. Após fazer login, voltará para o app

## ❌ ERROS COMUNS

### Erro: "operation-not-allowed"
**Causa**: Google Sign-In não está habilitado
**Solução**: Ative o toggle "Enable" no Firebase Console

### Erro: "unauthorized-domain"
**Causa**: Domínio não autorizado
**Solução**: Adicione `localhost` aos domínios autorizados

### Nenhum erro, mas não redireciona
**Causa**: 
1. Google Sign-In não está habilitado
2. Bloqueador de popup/redirect ativo
**Solução**: 
1. Verifique se o toggle está ativado
2. Desative bloqueadores de popup
3. Tente em uma janela anônima

## 📸 ONDE ESTÁ O TOGGLE?
1. Firebase Console > Authentication > Sign-in method
2. Clique em "Google"
3. O toggle "Enable" está no topo da página
4. Ele deve estar **VERDE/ATIVADO**

## 🆘 AINDA NÃO FUNCIONA?
1. Me envie uma captura de tela da página "Authentication > Sign-in method > Google"
2. Me diga se o toggle "Enable" está ativado ou desativado
3. Me envie os logs do console quando clicar no botão

