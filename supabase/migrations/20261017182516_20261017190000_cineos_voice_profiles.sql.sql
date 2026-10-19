/*
# CINEOS: voice profiles

1. New Table
- `voice_profiles` — Voice Studio: hồ sơ giọng đọc cho mỗi character.
  Columns: character_id (FK characters), voice (tên model giọng), language, accent,
  emotion, energy int 0-100, pitch, speed, notes.

2. Security
- RLS enabled; 4 open policies TO anon, authenticated — app single-tenant không đăng nhập.

3. Seed
- Tạo profile mẫu cho các character của project "The Little Explorer".
*/

CREATE TABLE IF NOT EXISTS voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  voice text NOT NULL DEFAULT 'AUTO',
  language text NOT NULL DEFAULT 'vi-VN',
  accent text DEFAULT 'Miền Nam',
  emotion text DEFAULT 'Tự nhiên',
  energy int NOT NULL DEFAULT 60,
  pitch text DEFAULT 'Trung bình',
  speed text DEFAULT '1.0x',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_select_voice_profiles" ON voice_profiles;
CREATE POLICY "open_select_voice_profiles" ON voice_profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "open_insert_voice_profiles" ON voice_profiles;
CREATE POLICY "open_insert_voice_profiles" ON voice_profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "open_update_voice_profiles" ON voice_profiles;
CREATE POLICY "open_update_voice_profiles" ON voice_profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_delete_voice_profiles" ON voice_profiles;
CREATE POLICY "open_delete_voice_profiles" ON voice_profiles FOR DELETE TO anon, authenticated USING (true);

INSERT INTO voice_profiles (project_id, character_id, voice, emotion, energy, pitch, speed, notes)
SELECT c.project_id, c.id, v.voice, v.emotion, v.energy, v.pitch, v.speed, v.notes
FROM characters c
JOIN (VALUES
  ('CHAR_0001', 'WARM_ADULT_M1', 'Ấm áp, kiên nhẫn, hơi mệt vì công việc', 55, 'Trầm trung', '0.95x', 'Giọng ba — nền tảng cảm xúc của series'),
  ('CHAR_0002', 'BRIGHT_CHILD_M1', 'Háo hức, trong trẻo, full năng lượng', 85, 'Cao', '1.05x', 'Giọng bé — tạo comedic timing với pause tự nhiên'),
  ('CHAR_0003', 'NARRATOR_W1', 'Kể chuyện nhẹ nhàng, storybook feel', 45, 'Trung', '0.9x', 'Narrator cho opening/ending')
) AS v(code, voice, emotion, energy, pitch, speed, notes)
  ON c.code = v.code
WHERE NOT EXISTS (SELECT 1 FROM voice_profiles vp WHERE vp.character_id = c.id);
