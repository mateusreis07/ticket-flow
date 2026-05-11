# Documentação do Sistema TicketFlow

Este documento mapeia o estado atual do sistema, focando nas rotas, estrutura de notificações, Cron Jobs (agendamentos) e fluxo de compras. Esta visão geral serve como guia para a preparação rumo ao ambiente de produção.

---

## 1. Mapeamento de Rotas (Next.js App Router)

### 1.1. Rotas Públicas (Acesso Aberto)
* **`/` (Home):** Exibe a busca hero, barra de categorias, seção de *Organizadores em Destaque* (recente) e grid de *Próximos Eventos*.
* **`/busca`:** Motor de busca completo para eventos (filtros por título, local e categoria).
* **`/events/[id]`:** Página de detalhes do evento. Contém a compra de ingressos (seletor) e agora exibe o perfil do organizador linkado.
* **`/organizadores`:** Listagem de todos os organizadores ativos na plataforma.
* **`/organizadores/[username]`:** Perfil público do organizador (Eventos passados/futuros, estatísticas, foto, capa, e botão "Seguir").

### 1.2. Rotas de Autenticação (Auth)
* **`/auth/login`:** Entrada de usuários (compradores e organizadores).
* **`/auth/cadastro`:** Registro. O fluxo atual permite o registro inicial direto.
* **`/auth/recuperar-senha`:** Fluxo de esquecimento de senha.

### 1.3. Rotas do Comprador (Protegidas)
* **`/meus-ingressos`:** Dashboard focado no consumidor para gerenciar ingressos comprados. Exibe também um filtro para o usuário autenticado.
* **`/meus-organizadores`:** Listagem dos organizadores que o comprador segue atualmente.

### 1.4. Rotas do Organizador (Protegidas)
* **`/dashboard`:** Visão geral do organizador, métricas de vendas (em breve).
* **`/dashboard/eventos` e `/dashboard/eventos/criar`:** Gestão de eventos.
* **`/dashboard/scanner`:** Interface de validação de ingressos com QR Code no dia do evento.
* **`/dashboard/perfil`:** Formulário para configuração da página pública do organizador (Foto, Capa, Bio, Redes Sociais, Username URL).
* **`/dashboard/configuracoes`:** Configurações de conta e financeiras (integração Stripe).

---

## 2. Sistema de Notificações PWA e Web Push

A arquitetura das notificações push baseia-se no pacote `web-push` associado aos Service Workers (`push-sw.js`). As chaves **VAPID** configuradas nas variáveis de ambiente certificam os envios perante os navegadores.

### 2.1. Inscrição do Usuário
* O usuário autoriza as notificações via `<NotificationBell />` no Header. A assinatura é salva na tabela `push_subscriptions`.

### 2.2. Notificações Real-Time (Imediatas)
Disparadas no exato momento de uma ação, independente de Cron Jobs:
* **Confirmação de Compra (Comprador):** Na rota `/api/webhooks/stripe`, assim que o Stripe confirma o pagamento (status `checkout.session.completed`), a API cria os ingressos (`tickets`) e dispara via `web-push` o aviso "Seu ingresso foi garantido!".
* **Notificação de Venda (Organizador):** No mesmo webhook do Stripe, após o pagamento, também pode ser enviado um push para o organizador avisando "Nova Venda Realizada!" (Atualmente mapeado para ser adicionado em produção).
* **Novo Evento de Organizador Seguido (Followers):** Quando um organizador que o usuário segue publica um evento novo (a implementar no form de eventos).

### 2.3. Notificações Agendadas (Cron Jobs)
Geridas por agendadores de tarefas (Vercel Cron).

---

## 3. Cron Jobs e Tarefas em Segundo Plano (Agendamento)

Devido às limitações do plano Hobby da Vercel (1 Cron Job permitido), unificamos todas as rotinas em uma **única rota mestra**.

### 3.1. Rota Mestra: `/api/cron/daily`
* **Horário:** Roda todos os dias às `00:00 UTC` (Configurado no `vercel.json`: `"schedule": "0 0 * * *"`).
* **Segurança:** Requer autenticação via Bearer Token utilizando a chave `CRON_SECRET` definida nas variáveis de ambiente.

### 3.2. Funções Executadas na Rota Mestra
1. **Lembrete de Eventos (Push):**
   * Busca na tabela de ingressos (`tickets`) por compras de usuários.
   * Filtra eventos que ocorrerão em **exatamente 1 dia** a partir de hoje.
   * Dispara pushes lembrando os compradores de que o evento é amanhã.
2. **Expiração de Pedidos Abandonados (Limpeza):**
   * Busca pedidos em status `pending` gerados há mais de `15 minutos`.
   * Retorna os ingressos reservados para o estoque (aumentando `quantity_total` dos `ticket_types`).
   * Marca o pedido como `expired`.

> **Nota para Produção:** Em produção ou num plano Vercel Pro, essa rota poderá ser desmembrada. A expiração de ingressos, idealmente, rodaria a cada minuto para não travar os estoques. No momento de transição para produção, esses "timers" serão reajustados para a realidade de alta demanda.

---

## 4. Banco de Dados Atualizado

Os módulos mais recentes inseriram as seguintes estruturas no Supabase:
* **`follows` (Tabela):** Para registro de "quem segue quem", com proteção de RLS.
* **`profiles` (Novas Colunas):** `bio`, `avatar_url`, `cover_url`, `username`, `city`, `state`, `website`, redes sociais e contadores automáticos (`followers_count`).
* **`organizer_profiles` (View SQL):** Para consolidar as estatísticas dos organizadores num lugar só, unindo os dados do perfil com somatórias de eventos (`upcoming_events_count`, `past_events_count`, `total_tickets_sold`). Usada nas requisições do App Router.

---

## Próximos Passos (Checklist Final de Setup)
1. **Ativação Real de E-mails:** Trocar a chave do Resend de "Teste" para "Produção".
2. **Webhook do Stripe Live:** Migrar as chaves Test (`pk_test`, `sk_test`) para Live (`pk_live`, `sk_live`). Atualizar os Webhooks.
3. **Escalonamento do Cron:** Ajustar Cron da Vercel para plano Pro, permitindo varreduras a cada 1 minuto nas reservas pendentes.
4. **Revisão Visual Real-Time:** Testar fluxos inteiros com cache real, especialmente renderização otimista no botão de Follow.
