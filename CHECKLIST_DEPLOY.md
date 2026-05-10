# Checklist de Deploy — TicketFlow

Sempre que subir atualizações para o Vercel, valide os pontos abaixo no ambiente online:

## Teste rápido (após qualquer deploy — 5 minutos):
- [ ] Homepage carrega sem erros
- [ ] Banner de modo teste aparece em amarelo
- [ ] Login funciona
- [ ] Criar evento funciona
- [ ] Criar/adicionar Ingressos ao evento funciona
- [ ] Página pública do evento abre

## Teste completo (após deploy de funcionalidade nova):

### Área pública:
- [ ] Homepage lista eventos publicados
- [ ] Busca de eventos funciona
- [ ] Página do evento mostra ingressos disponíveis
- [ ] Botão de compra aparece (logado) ou redireciona para login (não logado)

### Autenticação:
- [ ] Cadastro de comprador cria conta
- [ ] Cadastro de organizador cria conta
- [ ] Login redireciona corretamente por role
- [ ] Logout funciona
- [ ] Rota /dashboard sem login → redireciona

### Compra (usar cartão 4242 4242 4242 4242):
- [ ] Seleção de ingressos e resumo corretos
- [ ] Checkout abre com timer funcionando
- [ ] Stripe Checkout abre ao clicar pagar
- [ ] Pagamento aprovado → volta para /sucesso
- [ ] Pedido aparece como "paid" no Supabase
- [ ] Tickets criados na tabela `tickets`
- [ ] E-mail de confirmação chega (para e-mail da conta Resend se domínio não verificado)
- [ ] E-mail com QR Code chega

### Ingressos:
- [ ] /meus-ingressos mostra os tickets
- [ ] Modal com QR Code abre
- [ ] Página fullscreen funciona no celular

### Dashboard:
- [ ] Métricas aparecem com dados reais
- [ ] Gráfico de vendas renderiza
- [ ] Lista de compradores aparece

### Scanner:
- [ ] Câmera inicializa ao pedir permissão
- [ ] Overlay verde para ingresso válido
- [ ] Overlay vermelho para ingresso já usado

### Verificações de segurança:
- [ ] `SERVICE_ROLE_KEY` não aparece no DevTools (Network / Application tabs)
- [ ] `STRIPE_SECRET_KEY` não aparece no DevTools
- [ ] `/api/health` retorna status `ok`
- [ ] Rota `/dashboard` sem login redireciona corretamente para `/auth/login`
