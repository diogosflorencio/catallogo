# 🔧 Configuração do Stripe - Guia Completo

## 📋 O que foi alterado

O código foi atualizado para usar os **Price IDs** dos produtos que você criou no Stripe Dashboard, ao invés de criar preços dinamicamente.

## ✅ Passo a Passo para Configuração

### 1. Obter os Price IDs no Stripe

1. Acesse: https://dashboard.stripe.com/products
2. Para cada produto (Pro e Premium):
   - Clique no produto
   - Na seção "Pricing", você verá os preços
   - Copie o **Price ID** (começa com `price_xxxxx`)
   - Exemplo: `price_1ABC123def456GHI789`

### 2. Configurar Variáveis de Ambiente no Vercel

1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```
STRIPE_SECRET_KEY=sk_live_xxxxx (sua chave secreta de produção)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (secret do webhook)
STRIPE_PRICE_ID_PRO=price_xxxxx (Price ID do plano Pro)
STRIPE_PRICE_ID_PREMIUM=price_xxxxx (Price ID do plano Premium)
```

### 3. Configurar Webhook no Stripe

1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/api/stripe/webhook`
   - **Events to send**: Selecione:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
4. Copie o **Signing secret** (começa com `whsec_`)
5. Adicione como `STRIPE_WEBHOOK_SECRET` no Vercel

### 4. Verificar Configuração dos Produtos no Stripe

Certifique-se de que seus produtos estão configurados corretamente:

- ✅ **Recurring billing**: Habilitado (mensal)
- ✅ **Currency**: BRL (Real brasileiro)
- ✅ **Price**: Os valores que você definiu
- ✅ **Product name**: Pode ser qualquer nome (ex: "Plano Pro - Catallogo")

### 5. Testar

1. Faça deploy no Vercel
2. Acesse a página de planos
3. Clique em "Assinar" em um plano pago
4. Verifique se:
   - O preço correto aparece no checkout
   - O pagamento é processado
   - O plano é atualizado após o pagamento

## 🔍 Troubleshooting

### Problema: Preço antigo aparece no checkout

**Solução**: 
- Verifique se os Price IDs estão corretos no Vercel
- Certifique-se de que está usando os Price IDs de **produção** (não test mode)
- Faça um novo deploy após adicionar as variáveis

### Problema: Webhook não funciona

**Solução**:
- Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
- Certifique-se de que o endpoint está acessível publicamente
- Verifique os logs do Vercel para erros

### Problema: Erro "Price ID não configurado"

**Solução**:
- Verifique se as variáveis `STRIPE_PRICE_ID_PRO` e `STRIPE_PRICE_ID_PREMIUM` estão configuradas
- Certifique-se de que fez deploy após adicionar as variáveis

## 📝 Notas Importantes

1. **Product IDs (prod_xxx)**: Não são necessários. O código usa apenas os **Price IDs (price_xxx)**

2. **Test Mode vs Live Mode**: 
   - Certifique-se de usar a chave de **produção** (`sk_live_xxx`)
   - Os Price IDs devem ser de produtos em **modo produção**

3. **Webhook**: É essencial para atualizar o plano do usuário automaticamente após o pagamento

4. **Cancelamento**: Atualmente funciona fazendo downgrade direto no banco. Para cancelar a subscription no Stripe também, seria necessário armazenar `customer_id` e `subscription_id` no perfil do usuário (melhoria futura).

## 🚀 Próximos Passos (Opcional)

Para uma implementação mais completa, você poderia:

1. Armazenar `stripe_customer_id` e `stripe_subscription_id` no perfil do usuário
2. Melhorar o cancelamento para cancelar a subscription no Stripe também
3. Implementar upgrade/downgrade de planos
4. Adicionar histórico de pagamentos


