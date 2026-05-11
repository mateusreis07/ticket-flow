-- 1. Adicionar colunas de perfil na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS cover_url text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS instagram text,
ADD COLUMN IF NOT EXISTS facebook text,
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS total_events integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tickets_sold integer DEFAULT 0;

-- 2. Criar tabela de seguidores
CREATE TABLE public.follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL 
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL 
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer autenticado pode ver follows"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuário insere apenas como follower"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Usuário deleta apenas os seus"
  ON public.follows FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- 3. Índices
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);
CREATE UNIQUE INDEX idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;

-- 4. Criar view organizer_profiles com stats completos
CREATE OR REPLACE VIEW public.organizer_profiles AS
SELECT
  p.id,
  p.name,
  p.username,
  p.bio,
  p.avatar_url,
  p.cover_url,
  p.website,
  p.instagram,
  p.facebook,
  p.whatsapp,
  p.city,
  p.state,
  p.is_verified,
  p.created_at,
  COUNT(DISTINCT e.id) FILTER (
    WHERE e.status = 'published'
  ) AS published_events_count,
  COUNT(DISTINCT e.id) FILTER (
    WHERE e.status = 'published'
    AND e.event_date >= CURRENT_DATE
  ) AS upcoming_events_count,
  COUNT(DISTINCT e.id) FILTER (
    WHERE e.status = 'published'
    AND e.event_date < CURRENT_DATE
  ) AS past_events_count,
  COALESCE(SUM(tt.quantity_sold), 0) AS total_tickets_sold,
  COUNT(DISTINCT f.follower_id) AS followers_count
FROM public.profiles p
LEFT JOIN public.events e ON e.organizer_id = p.id
LEFT JOIN public.ticket_types tt ON tt.event_id = e.id
LEFT JOIN public.follows f ON f.following_id = p.id
WHERE p.role = 'organizer'
GROUP BY p.id;

-- 5. Criar bucket de storage para avatars e covers
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT DO NOTHING;

-- Policies avatars
CREATE POLICY "Upload avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Read avatar" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Delete avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policies covers
CREATE POLICY "Upload cover" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Read cover" ON storage.objects FOR SELECT TO public USING (bucket_id = 'covers');
CREATE POLICY "Delete cover" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 6. Gerar usernames para organizadores existentes
UPDATE public.profiles
SET username = LOWER(REPLACE(name, ' ', '.')) || '-' || SUBSTRING(id::text, 1, 4)
WHERE role = 'organizer' AND username IS NULL;
