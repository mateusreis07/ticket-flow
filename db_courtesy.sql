CREATE TABLE public.courtesy_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL
    REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  list_type text NOT NULL DEFAULT 'courtesy'
    CHECK (list_type IN (
      'courtesy', 'vip', 'press', 'staff',
      'sponsor', 'guest'
    )),
  max_entries integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.courtesy_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id uuid NOT NULL
    REFERENCES public.courtesy_lists(id)
    ON DELETE CASCADE,
  event_id uuid NOT NULL
    REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  guest_document text,
  ticket_type_id uuid NOT NULL
    REFERENCES public.ticket_types(id)
    ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1
    CHECK (quantity > 0 AND quantity <= 10),
  note text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'sent', 'confirmed',
      'cancelled', 'expired'
    )),
  sent_at timestamptz,
  confirmed_at timestamptz,
  expires_at timestamptz,
  created_by uuid NOT NULL
    REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS is_courtesy boolean
  DEFAULT false,
ADD COLUMN IF NOT EXISTS courtesy_entry_id uuid
  REFERENCES public.courtesy_entries(id)
  ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS courtesy_list_id uuid
  REFERENCES public.courtesy_lists(id)
  ON DELETE SET NULL;

ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS is_courtesy boolean
  DEFAULT false,
ADD COLUMN IF NOT EXISTS courtesy_entry_id uuid
  REFERENCES public.courtesy_entries(id)
  ON DELETE SET NULL;

CREATE TRIGGER update_courtesy_lists_updated_at
  BEFORE UPDATE ON public.courtesy_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courtesy_entries_updated_at
  BEFORE UPDATE ON public.courtesy_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_courtesy_lists_event
  ON public.courtesy_lists(event_id);

CREATE INDEX idx_courtesy_lists_organizer
  ON public.courtesy_lists(organizer_id);

CREATE INDEX idx_courtesy_entries_list
  ON public.courtesy_entries(list_id);

CREATE INDEX idx_courtesy_entries_event
  ON public.courtesy_entries(event_id);

CREATE INDEX idx_courtesy_entries_email
  ON public.courtesy_entries(guest_email);

CREATE INDEX idx_courtesy_entries_status
  ON public.courtesy_entries(status);

ALTER TABLE public.courtesy_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer_select_own_courtesy_lists" ON public.courtesy_lists FOR SELECT USING (organizer_id = auth.uid());
CREATE POLICY "organizer_insert_own_courtesy_lists" ON public.courtesy_lists FOR INSERT WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "organizer_update_own_courtesy_lists" ON public.courtesy_lists FOR UPDATE USING (organizer_id = auth.uid());
CREATE POLICY "organizer_delete_own_courtesy_lists" ON public.courtesy_lists FOR DELETE USING (organizer_id = auth.uid());

ALTER TABLE public.courtesy_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer_select_own_courtesy_entries" ON public.courtesy_entries FOR SELECT USING (organizer_id = auth.uid());
CREATE POLICY "organizer_insert_own_courtesy_entries" ON public.courtesy_entries FOR INSERT WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "organizer_update_own_courtesy_entries" ON public.courtesy_entries FOR UPDATE USING (organizer_id = auth.uid());
CREATE POLICY "organizer_delete_own_courtesy_entries" ON public.courtesy_entries FOR DELETE USING (organizer_id = auth.uid() AND status = 'pending');

CREATE OR REPLACE VIEW public.courtesy_stats AS
SELECT
  e.id as event_id,
  e.title as event_title,
  cl.id as list_id,
  cl.name as list_name,
  cl.list_type,
  COUNT(ce.id) as total_entries,
  SUM(ce.quantity) as total_tickets,
  COUNT(ce.id) FILTER (
    WHERE ce.status = 'sent'
  ) as sent_count,
  COUNT(ce.id) FILTER (
    WHERE ce.status = 'confirmed'
  ) as confirmed_count,
  COUNT(ce.id) FILTER (
    WHERE ce.status = 'pending'
  ) as pending_count,
  COUNT(ce.id) FILTER (
    WHERE ce.status = 'cancelled'
  ) as cancelled_count
FROM public.events e
JOIN public.courtesy_lists cl ON cl.event_id = e.id
LEFT JOIN public.courtesy_entries ce ON ce.list_id = cl.id
GROUP BY e.id, e.title, cl.id, cl.name, cl.list_type;
