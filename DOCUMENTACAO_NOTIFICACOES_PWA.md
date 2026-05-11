# 📱 Guia de Notificações PWA e Rotas Automáticas (TicketFlow)

Este documento descreve a arquitetura atual de notificações push e rotinas automáticas da plataforma.

## 🚀 1. Arquitetura de Notificações Push

A plataforma utiliza o protocolo padrão de **Web Push Notifications**, o que significa que o custo é **zero** (não depende de APIs pagas como Firebase Cloud Messaging ou OneSignal).

### ⚡ Notificações em Tempo Real (Event-Driven)
Estas notificações acontecem no exato momento em que o evento ocorre no servidor.

| Evento | Gatilho | Destino | Ação ao Clicar |
| :--- | :--- | :--- | :--- |
| **Confirmação de Compra** | Webhook do Stripe (`checkout.session.completed`) | Comprador | Abre a página "Meus Ingressos" |
| **Mensagem do Organizador** | Ação manual no Painel do Organizador | Todos os inscritos | Abre a Central de Notificações |
| **Status de Pedido** | Alteração manual de status via Admin | Comprador | Detalhes do Pedido |

---

## 📅 2. Rotina Automática (Cron Job Mestre)

Para otimizar o uso do plano gratuito da Vercel (que permite apenas 1 Cron Job), unificamos todas as tarefas agendadas em uma única rota mestra.

**Endpoint:** `/api/cron/daily`
**Horário:** Todos os dias às **00:00 (Meia-noite)**.

### O que esta rota faz (em sequência):

1.  **Limpeza de Estoque**: Busca pedidos com status `pending` cujo tempo limite (`expires_at`) já passou. Cancela o pedido e devolve os ingressos para o estoque do evento.
2.  **Lembretes de Eventos**: Busca todos os ingressos válidos para eventos que acontecerão **amanhã**. Envia um push para o comprador avisando sobre o horário e local.

---

## 🛠️ 3. Configuração de Infraestrutura

### Service Worker
O coração do PWA é o arquivo `public/sw.js` (gerado automaticamente) que importa a lógica customizada de `public/push-sw.js`.
*   **Registro**: Feito manualmente pelo componente `PWARegistration.tsx` no layout raiz.
*   **Tratamento de Clique**: O código em `push-sw.js` gerencia o foco da aba ou a abertura da URL correta quando o usuário clica no balão de notificação.

### Variáveis de Ambiente (Vercel)
Para as notificações funcionarem, estas variáveis devem estar configuradas no dashboard da Vercel:

*   `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Identidade pública do seu servidor de push.
*   `VAPID_PRIVATE_KEY`: Segredo para assinar as mensagens.
*   `VAPID_EMAIL`: E-mail de contato para os serviços de push (Google/Apple).
*   `CRON_SECRET`: Senha que valida se quem está chamando a rota de Cron é realmente a Vercel.

---

## 📋 4. Checklist para Produção Real

Quando o sistema for entrar em escala real, estes são os ajustes recomendados:

1.  **Upgrade de Plano**: Se o volume de lembretes crescer muito, pode ser necessário separar os Crons ou aumentar o timeout das funções (Hobby tier tem 10s-60s).
2.  **Fila de Envio (Queue)**: Para enviar para milhares de usuários simultaneamente (ex: comunicado de cancelamento de show), recomenda-se usar um serviço de fila (como Upstash QStash) para evitar que o timeout do servidor interrompa o envio no meio.
3.  **Analytics**: Adicionar rastreamento de taxa de abertura (cliques) nas notificações para medir o engajamento.

---

**Nota Técnica:** As chaves VAPID são permanentes. Se você alterá-las, todos os usuários inscritos anteriormente perderão a conexão e precisarão se inscrever novamente.
