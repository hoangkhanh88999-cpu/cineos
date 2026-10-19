/*
# CINEOS: asset library + release studio

1. New Tables (single-tenant, no auth; RLS open to anon + authenticated)
- `assets` — Asset Library: mọi tài nguyên của project (character sheet, location still,
  prop render, video, image, audio, prompt, document). Columns: name, type
  (CHARACTER/LOCATION/PROP/VIDEO/IMAGE/AUDIO/PROMPT/DOCUMENT), collection text,
  ref_id uuid (trỏ tới entity gốc nếu có), url text, meta jsonb, tags text[].
- `release_outputs` — Release Studio: mỗi dòng là một sản phẩm xuất bản từ master
  (trailer, teaser, poster, thumbnail, short, vertical, subtitle, localization, press kit).
  Columns: kind, title, status (NOT_STARTED/QUEUED/GENERATING/REVIEW/APPROVED/PUBLISHED),
  duration_s, language, notes.

2. Security
- RLS enabled; 4 open policies mỗi bảng TO anon, authenticated (USING/WITH CHECK true)
  — app studio single-tenant, không đăng nhập.

3. Seed (project "The Little Explorer")
- 9 release output types mặc định, trạng thái NOT_STARTED.
- Vài asset mẫu gắn với characters/locations/props có sẵn.
*/

CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  collection text,
  ref_id uuid,
  url text,
  meta jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS release_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text,
  status text NOT NULL DEFAULT 'NOT_STARTED',
  duration_s int,
  language text DEFAULT 'vi',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_outputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_select_assets" ON assets;
CREATE POLICY "open_select_assets" ON assets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "open_insert_assets" ON assets;
CREATE POLICY "open_insert_assets" ON assets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "open_update_assets" ON assets;
CREATE POLICY "open_update_assets" ON assets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_delete_assets" ON assets;
CREATE POLICY "open_delete_assets" ON assets FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "open_select_release_outputs" ON release_outputs;
CREATE POLICY "open_select_release_outputs" ON release_outputs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "open_insert_release_outputs" ON release_outputs;
CREATE POLICY "open_insert_release_outputs" ON release_outputs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "open_update_release_outputs" ON release_outputs;
CREATE POLICY "open_update_release_outputs" ON release_outputs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_delete_release_outputs" ON release_outputs;
CREATE POLICY "open_delete_release_outputs" ON release_outputs FOR DELETE TO anon, authenticated USING (true);

-- Seed release outputs for the explorer project
INSERT INTO release_outputs (project_id, kind, title, status)
SELECT p.id, v.kind, v.title, 'NOT_STARTED'
FROM projects p
CROSS JOIN (VALUES
  ('TRAILER', 'Trailer chính'),
  ('TEASER', 'Teaser 15s'),
  ('POSTER', 'Poster chính'),
  ('THUMBNAIL', 'Thumbnail YouTube'),
  ('SHORT', 'Short 60s'),
  ('VERTICAL', 'Vertical 9:16'),
  ('SUBTITLE', 'Phụ đề'),
  ('LOCALIZATION', 'Bản địa hóa'),
  ('PRESS_KIT', 'Press kit')
) AS v(kind, title)
WHERE p.name LIKE '%Little Explorer%'
  AND NOT EXISTS (SELECT 1 FROM release_outputs ro WHERE ro.project_id = p.id);

-- Seed a few sample assets (LATERAL so subqueries can reference p)
INSERT INTO assets (project_id, name, type, collection, ref_id, tags)
SELECT p.id, v.name, v.type, v.collection, v.ref_id, v.tags
FROM projects p
CROSS JOIN LATERAL (VALUES
  ('Character sheet — Bé Khôi v1', 'CHARACTER', 'Characters', (SELECT c.id FROM characters c WHERE c.project_id = p.id LIMIT 1), ARRAY['bible','reference']::text[]),
  ('Concept — Nhà bếp buổi sáng', 'LOCATION', 'Locations', (SELECT l.id FROM locations l WHERE l.project_id = p.id LIMIT 1), ARRAY['concept','color']::text[]),
  ('Prop render — Tên lửa đồ chơi', 'PROP', 'Props', (SELECT pr.id FROM props pr WHERE pr.project_id = p.id LIMIT 1), ARRAY['hero-prop']::text[]),
  ('Master Prompt — SC01_SH01', 'PROMPT', 'Prompts', NULL, ARRAY['prompt']::text[]),
  ('Storyboard frame — SC02', 'IMAGE', 'Storyboard', NULL, ARRAY['storyboard']::text[]),
  ('Theme music — Explorer Main', 'AUDIO', 'Music', NULL, ARRAY['theme']::text[])
) AS v(name, type, collection, ref_id, tags)
WHERE p.name LIKE '%Little Explorer%'
  AND NOT EXISTS (SELECT 1 FROM assets a WHERE a.project_id = p.id);
