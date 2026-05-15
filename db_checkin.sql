-- PARTE 1 - Tabela de sessões de check-in
CREATE TABLE IF NOT EXISTS public.checkin_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL
    REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_info text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  total_checkins integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- PARTE 2 - Tabela de logs de check-in
CREATE TABLE IF NOT EXISTS public.checkin_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL
    REFERENCES public.checkin_sessions(id)
    ON DELETE CASCADE,
  ticket_id uuid
    REFERENCES public.tickets(id) ON DELETE SET NULL,
  qr_code text,
  buyer_name text,
  ticket_type_name text,
  result text NOT NULL
    CHECK (result IN (
      'success', 'already_used', 'not_found',
      'wrong_event', 'manual_override'
    )),
  checked_in_at timestamptz DEFAULT now(),
  synced_at timestamptz,
  is_synced boolean DEFAULT false,
  operator_note text
);

-- PARTE 3 - Alterar tabela tickets
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS checked_in_by uuid
  REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS checkin_session_id uuid
  REFERENCES public.checkin_sessions(id)
  ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS checkin_method text
  CHECK (checkin_method IN (
    'qr_scanner', 'manual_list', 'manual_override'
  ));

-- PARTE 4 - Índices
CREATE INDEX IF NOT EXISTS idx_checkin_sessions_event
  ON public.checkin_sessions(event_id);

CREATE INDEX IF NOT EXISTS idx_checkin_logs_session
  ON public.checkin_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_checkin_logs_ticket
  ON public.checkin_logs(ticket_id)
  WHERE ticket_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_checkin_logs_synced
  ON public.checkin_logs(is_synced)
  WHERE is_synced = false;

-- PARTE 5 - RLS e Políticas
ALTER TABLE public.checkin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizer_select_own_sessions" ON public.checkin_sessions;
CREATE POLICY "organizer_select_own_sessions"
  ON public.checkin_sessions FOR SELECT
  USING (organizer_id = auth.uid());

DROP POLICY IF EXISTS "organizer_insert_own_sessions" ON public.checkin_sessions;
CREATE POLICY "organizer_insert_own_sessions"
  ON public.checkin_sessions FOR INSERT
  WITH CHECK (organizer_id = auth.uid());

DROP POLICY IF EXISTS "organizer_update_own_sessions" ON public.checkin_sessions;
CREATE POLICY "organizer_update_own_sessions"
  ON public.checkin_sessions FOR UPDATE
  USING (organizer_id = auth.uid());

DROP POLICY IF EXISTS "organizer_select_session_logs" ON public.checkin_logs;
CREATE POLICY "organizer_select_session_logs"
  ON public.checkin_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.checkin_sessions cs
    WHERE cs.id = checkin_logs.session_id
      AND cs.organizer_id = auth.uid()
  ));

DROP POLICY IF EXISTS "organizer_insert_session_logs" ON public.checkin_logs;
CREATE POLICY "organizer_insert_session_logs"
  ON public.checkin_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.checkin_sessions cs
    WHERE cs.id = checkin_logs.session_id
      AND cs.organizer_id = auth.uid()
  ));

-- Note: UPDATE em checkin_logs is typically done by service_role, no specific policy needed unless client updating.
-- We can add a policy if the client marks as synced:
DROP POLICY IF EXISTS "organizer_update_session_logs" ON public.checkin_logs;
CREATE POLICY "organizer_update_session_logs"
  ON public.checkin_logs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.checkin_sessions cs
    WHERE cs.id = checkin_logs.session_id
      AND cs.organizer_id = auth.uid()
  ));


-- Função para processar check-ins em lote de forma atômica
CREATE OR REPLACE FUNCTION public.process_bulk_checkins(
  p_session_id UUID,
  p_organizer_id UUID,
  checkin_data JSONB
)
RETURNS JSONB AS $$
DECLARE
  item RECORD;
  success_count INT := 0;
  error_count INT := 0;
BEGIN
  -- checkin_data: [{ticketId, qrCode, buyerName, ticketTypeName, result, timestamp}, ...]
  FOR item IN SELECT * FROM jsonb_to_recordset(checkin_data) 
    AS x(ticketId UUID, qrCode TEXT, buyerName TEXT, ticketTypeName TEXT, result TEXT, timestamp TIMESTAMPTZ)
  LOOP
    BEGIN
      -- 1. Registrar log da ação offline (sempre registramos para auditoria)
      INSERT INTO public.checkin_logs (
        session_id, 
        ticket_id, 
        qr_code, 
        buyer_name, 
        ticket_type_name, 
        result, 
        checked_in_at, 
        is_synced, 
        synced_at
      )
      VALUES (
        p_session_id, 
        item.ticketId, 
        item.qrCode, 
        item.buyerName, 
        item.ticketTypeName, 
        item.result, 
        item.timestamp, 
        true, 
        now()
      );

      -- 2. Aplicar a alteração no ticket se foi sucesso/manual
      IF item.result IN ('success', 'manual_override') AND item.ticketId IS NOT NULL THEN
        UPDATE public.tickets
        SET 
          is_used = true,
          used_at = item.timestamp,
          checked_in_by = p_organizer_id,
          checkin_session_id = p_session_id,
          checkin_method = 'offline_sync'
        WHERE id = item.ticketId AND is_used = false;

        IF FOUND THEN
          success_count := success_count + 1;
        ELSE
          -- Se não deu FOUND, o ingresso já foi usado em outro lugar/sincronização
          error_count := error_count + 1;
        END IF;
      ELSE
        -- Se era erro ou não tinha ID, incrementamos o contador de "erros/não processados"
        IF item.result != 'success' THEN
           error_count := error_count + 1;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
    END;
  END LOOP;

  -- 3. Atualizar o contador da sessão uma única vez no final
  UPDATE public.checkin_sessions
  SET total_checkins = total_checkins + success_count
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success_count', success_count,
    'error_count', error_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PARTE 6 - View de Overview
CREATE OR REPLACE VIEW public.checkin_overview AS
SELECT
  e.id as event_id,
  e.title as event_title,
  e.event_date,
  e.event_time,
  e.organizer_id,
  COUNT(DISTINCT t.id) as total_tickets,
  COUNT(DISTINCT t.id) FILTER (
    WHERE t.is_used = true
  ) as checked_in_count,
  COUNT(DISTINCT t.id) FILTER (
    WHERE t.is_used = false
  ) as pending_count,
  ROUND(
    COUNT(DISTINCT t.id) FILTER (WHERE t.is_used = true)::numeric
    / NULLIF(COUNT(DISTINCT t.id), 0) * 100, 1
  ) as checkin_percentage
FROM public.events e
LEFT JOIN public.tickets t ON t.event_id = e.id
GROUP BY e.id, e.title, e.event_date, e.event_time, e.organizer_id;
