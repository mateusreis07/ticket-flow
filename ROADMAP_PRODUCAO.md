# Roadmap para Produção (Go-Live)

Siga estas etapas com cuidado quando for lançar o sistema TicketFlow oficialmente (recebendo pagamentos reais e usando domínios reais).

## O que muda ao ir para produção real:

### No Stripe:
- [ ] Ativar a conta (preencher dados do negócio).
- [ ] Trocar `sk_test_` por `sk_live_` nas variáveis de ambiente do Vercel.
- [ ] Trocar `pk_test_` por `pk_live_` nas variáveis de ambiente do Vercel.
- [ ] Criar novo webhook apontando para o domínio final (ex: `https://seusite.com/api/webhooks/stripe`).
- [ ] Trocar a variável `STRIPE_WEBHOOK_SECRET` pelo novo `whsec_live_` do painel Live do Stripe.

### No Resend:
- [ ] Adicionar e verificar domínio próprio no painel do Resend (configurar DNS - TXT/MX records).
- [ ] Trocar `RESEND_FROM_EMAIL` no Vercel para `noreply@seudominio.com`.
- [ ] Atualizar o endereço "From" e rodapés nos templates de e-mail se necessário.

### No Supabase:
- [ ] Atualizar `Site URL` em Authentication → URL Configuration para o domínio final.
- [ ] Atualizar `Redirect URLs` para o domínio final (adicionar `https://seusite.com/auth/callback`).
- [ ] Reativar "Confirm email" se desejar verificação de conta para novos usuários.
- [ ] Revisar as policies RLS (Row Level Security) nas tabelas principais para garantir blindagem total.

### No Vercel:
- [ ] Adicionar domínio próprio em Settings → Domains.
- [ ] Configurar DNS no registrador do domínio apontando para o Vercel.
- [ ] Aguardar propagação DNS (até 48h).
- [ ] Atualizar `NEXT_PUBLIC_APP_URL` nas variáveis de ambiente para o domínio final (`https://seusite.com`).
- [ ] Fazer redeploy para injetar as novas variáveis no build final.

## Após ir ao ar:
- [ ] Rodar o checklist completo (`CHECKLIST_DEPLOY.md`) fazendo uma compra de teste com um **cartão de crédito REAL** (crie um ingresso de R$ 1,00 para testar todo o fluxo de checkout ao e-mail final).
- [ ] Configurar um monitoramento tipo UptimeRobot apontando para `/api/health` para alertas de indisponibilidade.
- [ ] O banner amarelo de modo teste sumirá automaticamente assim que a variável `STRIPE_SECRET_KEY` não começar mais com `sk_test_`!
