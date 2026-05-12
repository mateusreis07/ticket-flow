-- ============================================================
-- MÓDULO DE CUPONS DE DESCONTO — TicketFlow
-- Rodar no Supabase SQL Editor
-- ============================================================

-- 1. Tabela principal de cupons
CREATE TABLE public.coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id)
    ON DELETE CASCADE,
  code text NOT NULL,
  description text,
  discount_type text NOT NULL
    CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(10,2) NOT NULL
    CHECK (discount_value > 0),
  min_order_amount numeric(10,2) DEFAULT 0,
  max_discount_amount numeric(10,2),
  max_uses integer,
  max_uses_per_user integer DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  applies_to text NOT NULL DEFAULT 'all'
    CHECK (applies_to IN ('all', 'specific_event', 'specific_ticket_type')),
  ticket_type_ids uuid[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT coupon_code_organizer_unique UNIQUE (organizer_id, code)
);

-- 2. Tabela de histórico de uso dos cupons
CREATE TABLE public.coupon_uses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id uuid NOT NULL
    REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id uuid NOT NULL
    REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  discount_applied numeric(10,2) NOT NULL,
  used_at timestamptz DEFAULT now(),
  UNIQUE(coupon_id, order_id)
);

-- 3. Adicionar colunas na tabela orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_id uuid
    REFERENCES public.coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal_amount numeric(10,2);

-- Atualizar pedidos existentes com subtotal = total (sem desconto)
UPDATE public.orders
SET subtotal_amount = total_amount,
    discount_amount = 0
WHERE subtotal_amount IS NULL;

-- 4. Trigger de updated_at para coupons
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Índices para performance
CREATE INDEX idx_coupons_organizer
  ON public.coupons(organizer_id);

CREATE INDEX idx_coupons_event
  ON public.coupons(event_id)
  WHERE event_id IS NOT NULL;

CREATE UNIQUE INDEX idx_coupons_code_upper
  ON public.coupons(organizer_id, UPPER(code));

CREATE INDEX idx_coupon_uses_coupon
  ON public.coupon_uses(coupon_id);

CREATE INDEX idx_coupon_uses_user
  ON public.coupon_uses(user_id);

-- 6. Habilitar RLS nas tabelas
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

-- Policies para coupons

-- Organizador vê os seus cupons
CREATE POLICY "organizer_select_own_coupons"
  ON public.coupons FOR SELECT
  USING (organizer_id = auth.uid());

-- Qualquer autenticado pode ver cupons ativos (para validar no checkout)
CREATE POLICY "authenticated_select_active_coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (valid_until IS NULL OR valid_until > now())
  );

-- Apenas organizador pode criar seus próprios cupons
CREATE POLICY "organizer_insert_coupons"
  ON public.coupons FOR INSERT
  WITH CHECK (organizer_id = auth.uid());

-- Apenas organizador pode atualizar seus cupons
CREATE POLICY "organizer_update_coupons"
  ON public.coupons FOR UPDATE
  USING (organizer_id = auth.uid());

-- Apenas organizador pode excluir seus cupons
CREATE POLICY "organizer_delete_coupons"
  ON public.coupons FOR DELETE
  USING (organizer_id = auth.uid());

-- Policies para coupon_uses

-- Comprador vê os seus usos
CREATE POLICY "buyer_select_own_uses"
  ON public.coupon_uses FOR SELECT
  USING (user_id = auth.uid());

-- Organizador vê usos dos seus cupons
CREATE POLICY "organizer_select_coupon_uses"
  ON public.coupon_uses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.coupons
      WHERE coupons.id = coupon_uses.coupon_id
        AND coupons.organizer_id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE apenas via service_role (server-side)
CREATE POLICY "service_role_insert_coupon_uses"
  ON public.coupon_uses FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_update_coupon_uses"
  ON public.coupon_uses FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "service_role_delete_coupon_uses"
  ON public.coupon_uses FOR DELETE
  TO service_role
  USING (true);

-- 7. Cupons de exemplo para teste
-- Substitua [ORGANIZER_ID] pelo seu ID de organizador
-- Disponível em Authentication → Users no Supabase Dashboard

/*
INSERT INTO public.coupons (organizer_id, code, description, discount_type, discount_value, max_uses_per_user, is_active, applies_to)
VALUES
  (
    '[ORGANIZER_ID]',
    'BEMVINDO10',
    'Cupom de boas-vindas: 10% de desconto',
    'percentage',
    10,
    1,
    true,
    'all'
  ),
  (
    '[ORGANIZER_ID]',
    'PRIMEIRACOMPRA',
    'Desconto fixo para primeira compra',
    'fixed',
    20.00,
    1,
    true,
    'all'
  ),
  (
    '[ORGANIZER_ID]',
    'VIP50',
    'Cupom VIP: 50% de desconto com teto de R$100',
    'percentage',
    50,
    1,
    true,
    'all',
    -- max_discount_amount = 100, max_uses = 5
    max_discount_amount := 100.00,
    max_uses := 5
  ),
  (
    '[ORGANIZER_ID]',
    'EXPIRADO',
    'Cupom expirado para testar validação',
    'percentage',
    15,
    1,
    true,
    'all',
    valid_until := now() - interval '1 day'
  );
*/

-- Versão correta dos INSERTs de exemplo (com todas as colunas explícitas):
/*
INSERT INTO public.coupons
  (organizer_id, code, description, discount_type, discount_value, max_uses_per_user, is_active, applies_to)
VALUES
  ('[ORGANIZER_ID]', 'BEMVINDO10', 'Cupom de boas-vindas: 10% de desconto', 'percentage', 10, 1, true, 'all');

INSERT INTO public.coupons
  (organizer_id, code, description, discount_type, discount_value, min_order_amount, max_uses_per_user, is_active, applies_to)
VALUES
  ('[ORGANIZER_ID]', 'PRIMEIRACOMPRA', 'Desconto fixo para primeira compra', 'fixed', 20.00, 0, 1, true, 'all');

INSERT INTO public.coupons
  (organizer_id, code, description, discount_type, discount_value, max_discount_amount, max_uses, max_uses_per_user, is_active, applies_to)
VALUES
  ('[ORGANIZER_ID]', 'VIP50', 'Cupom VIP: 50% de desconto com teto de R$100', 'percentage', 50, 100.00, 5, 1, true, 'all');

INSERT INTO public.coupons
  (organizer_id, code, description, discount_type, discount_value, max_uses_per_user, is_active, applies_to, valid_until)
VALUES
  ('[ORGANIZER_ID]', 'EXPIRADO', 'Cupom expirado para testar validação', 'percentage', 15, 1, true, 'all', now() - interval ''1 day'');
*/
