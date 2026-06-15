-- Phase 4: Community Enhancements - Message Edit/Delete Support

-- Add edited_at column to track message edits
ALTER TABLE room_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- RLS: Users can edit their own messages
CREATE POLICY "Users can edit own messages" ON room_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS: Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON room_messages
  FOR DELETE USING (auth.uid() = user_id);
