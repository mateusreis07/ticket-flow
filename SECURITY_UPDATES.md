# Relatório de Atualizações de Segurança e Estabilidade — TicketFlow

Este documento detalha as melhorias de segurança implementadas para garantir a integridade do processo de compra, controle de estoque e uso de cupons.

## 1. Correção de Duplicação de Ingressos (Idempotência)
**Problema:** O Webhook do Stripe processava múltiplas notificações simultâneas para o mesmo pedido, gerando ingressos duplicados (ex: usuário comprava 2 e recebia 4).
**Solução:** 
- Implementada **Trava Atômica** no `status` do pedido. A transição de `pending` para `paid` só ocorre uma vez.
- Adicionada checagem de existência de ingressos antes da geração.
- **Arquivo:** `app/api/webhooks/stripe/route.ts`

## 2. Proteção contra Overselling (Venda Acima da Capacidade)
**Problema:** "Race Condition" onde múltiplos usuários compravam o último ingresso disponível ao mesmo tempo. O código anterior lia o estoque e depois atualizava, permitindo ultrapassar o limite.
**Solução:** 
- Criada a função SQL `increment_ticket_stock` que realiza o incremento e a validação de capacidade em uma única operação atômica no banco de dados.
- **Arquivo:** `app/api/orders/create/route.ts`

## 3. Blindagem de Preços (Price Tampering)
**Problema:** Risco de manipulação do preço unitário antes da criação da sessão de checkout do Stripe.
**Solução:** 
- O sistema agora ignora os preços armazenados no pedido temporário e busca o valor real diretamente da "fonte da verdade" (`ticket_types`) no momento de gerar o link de pagamento.
- **Arquivo:** `app/api/checkout/route.ts`

## 4. Controle Atômico de Cupons
**Problema:** Uso de cupons limitados (ex: "primeiros 10") podia ser burlado se muitos usuários aplicassem o cupom simultaneamente.
**Solução:** 
- Criada a função SQL `increment_coupon_usage` para garantir que o contador de usos nunca ultrapasse o limite definido pelo organizador.
- **Arquivo:** `lib/coupons.ts`

---

## SQL de Referência (Scripts de Banco de Dados)

Estes scripts devem estar presentes no banco de dados para o funcionamento correto das travas de segurança:

```sql
-- 1. Função para incremento atômico de estoque com proteção de capacidade
CREATE OR REPLACE FUNCTION public.increment_ticket_stock(t_id UUID, q INT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.ticket_types
  SET quantity_sold = quantity_sold + q
  WHERE id = t_id AND (quantity_sold + q) <= quantity_total;
  
  -- Retorna TRUE se o estoque foi atualizado, FALSE se não havia estoque suficiente
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função para incremento atômico de uso de cupom com proteção de limite
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(c_id UUID, max_u INT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = c_id 
    AND (max_u IS NULL OR used_count < max_u)
    AND is_active = true;
  
  -- Retorna TRUE se o contador foi atualizado, FALSE se atingiu o limite
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Políticas RLS para Tickets (Privacidade)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer_select_own_tickets"
  ON public.tickets FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "organizer_select_event_tickets"
  ON public.tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = tickets.event_id
        AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "service_role_insert_tickets"
  ON public.tickets FOR INSERT
  TO service_role
  WITH CHECK (true);
```

## 5. Reversão de Cupons no Cancelamento
**Problema:** Cupons aplicados em pedidos cancelados continuavam contando como "usados".
**Solução:** 
- Integrada a função `removeCouponFromOrder` em todos os fluxos de cancelamento (manual, expiração Stripe e Cron).
- Adicionado bypass de RLS via `supabaseAdmin` para garantir que a reversão ocorra mesmo que o usuário comprador tenha restrições de visibilidade no campo do cupom.
- **Arquivos:** `lib/actions/orders.ts`, `lib/coupons.ts`
