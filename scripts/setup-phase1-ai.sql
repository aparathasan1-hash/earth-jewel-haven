-- ============================================================
-- EARTH JEWEL HAVEN — Faz 1: AI Asistan (DB temeli)
-- Idempotent. Sohbetler + mesajlar, RLS: sadece sahibi görür.
-- ============================================================

-- Sohbetler
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'support' CHECK (mode IN ('support', 'couples_bridge')),
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated ON public.ai_conversations(updated_at DESC);

DROP POLICY IF EXISTS "Users manage own conversations - select" ON public.ai_conversations;
CREATE POLICY "Users manage own conversations - select" ON public.ai_conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own conversations - insert" ON public.ai_conversations;
CREATE POLICY "Users manage own conversations - insert" ON public.ai_conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own conversations - update" ON public.ai_conversations;
CREATE POLICY "Users manage own conversations - update" ON public.ai_conversations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own conversations - delete" ON public.ai_conversations;
CREATE POLICY "Users manage own conversations - delete" ON public.ai_conversations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Mesajlar
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  -- Çiftler köprüsü meta verisi: {"speaker":"woman"|"man","target":"woman"|"man","crisis":bool}
  meta jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON public.ai_messages(user_id);

DROP POLICY IF EXISTS "Users manage own ai messages - select" ON public.ai_messages;
CREATE POLICY "Users manage own ai messages - select" ON public.ai_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own ai messages - insert" ON public.ai_messages;
CREATE POLICY "Users manage own ai messages - insert" ON public.ai_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users manage own ai messages - delete" ON public.ai_messages;
CREATE POLICY "Users manage own ai messages - delete" ON public.ai_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
