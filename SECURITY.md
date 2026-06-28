# Políticas de Segurança e Tratamento de Vulnerabilidades

## 1. Tratamento de Overselling (Race Condition)
O sistema foi desenhado para ser resiliente a compras simultâneas para o mesmo lote de ingressos.
- Utilizamos `PostgreSQL Functions (plpgsql)` com transações atômicas `SERIALIZABLE` ou com controle via restrições `CHECK` no banco de dados.
- Ao reservar um ingresso (em `create_order_atomic`), a quantidade (`quantity_sold`) é incrementada via uma query atômica. Se exceder a `quantity`, a transação sofre rollback e retorna erro.

## 2. Webhooks Idempotentes e Pagamentos Duplicados
- As notificações via webhook (ex: MercadoPago) podem chegar em duplicidade e em alta concorrência.
- As atualizações de status para pagamentos processados rodam dentro da function `confirm_order_payment`, garantindo que o status seja alterado de `pending` para `paid` via uma query transacional com controle atômico `WHERE status = 'pending'`.
- Os tickets apenas são gerados quando a alteração do pedido foi bem-sucedida, prevenindo envio de múltiplos ingressos para um único pagamento.

## 3. Rate Limiting e Prevenção de Fraude
- **Rate Limit**: Implementado com o `@upstash/ratelimit` usando Redis. Ele protege endpoints críticos como as rotas de criação de ordem (`/api/orders/create`), processamento de checkout (`/api/checkout/*`), e validação de check-in de QR Code.
- Caso o Redis esteja offline (Fallback):
  - Em endpoints críticos (onde há dinheiro/venda envolvida): bloqueia-se com HTTP 503 (Serviço indisponível temporariamente), visando a segurança primária da aplicação contra ataques DDoS e botnets de cartões clonados.
  - Em endpoints de consulta não críticas: aplica-se rate limiting básico ou via headers de edge (ex: Vercel KV) ou permite a operação se seguro.
- **Card Testing (Fraud Detection)**: Endpoints de validação de cartão ou checkout reportam comportamentos anômalos (como recusas massivas com mesmo IP) diretamente para o sentry via labels dedicadas (ex: `fraud_attempt`). Endpoints negam a persistência na tentativa.

## 4. Headers e Proteções Gerais de Middleware
- `X-Frame-Options` previne clickjacking.
- `X-Content-Type-Options: nosniff` restringe Mime-Type sniffing.
- `X-XSS-Protection` força bloqueio do navegador a scripts cross-site detectados em antigas engines.
- Rate Limiting integrado no Edge/Middleware previne exaustão de conexões na API (Layer 7).
