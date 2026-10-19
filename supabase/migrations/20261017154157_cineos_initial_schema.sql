/*
# CINEOS — AI Film Studio OS: initial schema

1. New Tables
- `projects`
  - `id` (uuid, primary key)
  - `name` (text, not null) — project title
  - `idea` (text) — raw idea text from wizard step 1
  - `format` (text) — series / film / short / vertical...
  - `genre` (text)
  - `tone` (text)
  - `audience` (text)
  - `distribution` (text)
  - `references_note` (text)
  - `constraints_note` (text)
  - `budget_note` (text)
  - `logline` (text)
  - `status` (text, not null, default 'IDEA') — pipeline stage: IDEA, DEVELOPMENT, GREENLIGHT, SCRIPT_DEVELOPMENT, SCRIPT_LOCK, PRE_PRODUCTION, VISUAL_LOCK, PRODUCTION, POST_PRODUCTION, FINAL_QC, MASTER_LOCK, MARKETING, RELEASED, ARCHIVED
  - `progress` (integer, 0-100, default 0)
  - `brief` (jsonb) — generated project brief (sections)
  - `created_at`, `updated_at`

- `episodes`
  - `id`, `project_id` (fk -> projects, cascade)
  - `number` (int), `title`, `logline`, `status` (default 'OUTLINE'), `created_at`

- `tasks`
  - `id`, `project_id` (nullable fk, cascade)
  - `title`, `department`, `agent`, `priority` (HIGH/MEDIUM/LOW), `status` (TODO/DOING/BLOCKED/DONE), `created_at`

- `activity`
  - `id`, `project_id` (nullable fk, cascade)
  - `kind`, `message`, `created_at`

- `nova_messages`
  - `id`, `project_id` (nullable fk, cascade)
  - `role` ('user'|'nova'), `content`, `created_at`

2. Security
- Single-tenant app without sign-in: RLS enabled on all tables, policies scoped TO anon, authenticated (intentionally shared data, USING (true) documented here).

3. Notes
- Seed data: one demo project (Family AI Series "The Little Explorer") + a few tasks and activity rows so the studio home is not empty on first open.
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  idea text,
  format text,
  genre text,
  tone text,
  audience text,
  distribution text,
  references_note text,
  constraints_note text,
  budget_note text,
  logline text,
  status text NOT NULL DEFAULT 'IDEA',
  progress integer NOT NULL DEFAULT 0,
  brief jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number integer NOT NULL,
  title text NOT NULL,
  logline text,
  status text NOT NULL DEFAULT 'OUTLINE',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  department text,
  agent text,
  priority text NOT NULL DEFAULT 'MEDIUM',
  status text NOT NULL DEFAULT 'TODO',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS nova_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE nova_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_episodes_project ON episodes(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_activity_project ON activity(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nova_project ON nova_messages(project_id);

DROP POLICY IF EXISTS "cineos_select" ON projects;
CREATE POLICY "cineos_select" ON projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "cineos_insert" ON projects;
CREATE POLICY "cineos_insert" ON projects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "cineos_update" ON projects;
CREATE POLICY "cineos_update" ON projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "cineos_delete" ON projects;
CREATE POLICY "cineos_delete" ON projects FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "cineos_select" ON episodes;
CREATE POLICY "cineos_select" ON episodes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "cineos_insert" ON episodes;
CREATE POLICY "cineos_insert" ON episodes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "cineos_update" ON episodes;
CREATE POLICY "cineos_update" ON episodes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "cineos_delete" ON episodes;
CREATE POLICY "cineos_delete" ON episodes FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "cineos_select" ON tasks;
CREATE POLICY "cineos_select" ON tasks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "cineos_insert" ON tasks;
CREATE POLICY "cineos_insert" ON tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "cineos_update" ON tasks;
CREATE POLICY "cineos_update" ON tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "cineos_delete" ON tasks;
CREATE POLICY "cineos_delete" ON tasks FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "cineos_select" ON activity;
CREATE POLICY "cineos_select" ON activity FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "cineos_insert" ON activity;
CREATE POLICY "cineos_insert" ON activity FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "cineos_update" ON activity;
CREATE POLICY "cineos_update" ON activity FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "cineos_delete" ON activity;
CREATE POLICY "cineos_delete" ON activity FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "cineos_select" ON nova_messages;
CREATE POLICY "cineos_select" ON nova_messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "cineos_insert" ON nova_messages;
CREATE POLICY "cineos_insert" ON nova_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "cineos_update" ON nova_messages;
CREATE POLICY "cineos_update" ON nova_messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "cineos_delete" ON nova_messages;
CREATE POLICY "cineos_delete" ON nova_messages FOR DELETE TO anon, authenticated USING (true);

-- Seed demo project
INSERT INTO projects (name, idea, format, genre, tone, audience, logline, status, progress, brief)
SELECT
  'The Little Explorer',
  'Một series về cậu bé 5 tuổi và ba mẹ cùng học cách trưởng thành qua những xung đột hàng ngày.',
  'Animated Series',
  'Family / Slice of life',
  'Warm, gentle comedy',
  'Parents with young kids',
  'Một cậu bé 5 tuổi tò mò và ba mẹ của cậu cùng học cách lớn lên — mỗi tập một bài học, không ai là phản diện.',
  'SCRIPT_DEVELOPMENT',
  35,
  jsonb_build_object(
    'premise', 'Gia đình nhỏ với cậu con trai 5 tuổi luôn đặt câu hỏi về thế giới. Mỗi xung đột nhỏ trong nhà là một cơ hội để cả nhà cùng trưởng thành.',
    'coreConflict', 'Ba mẹ muốn dạy con; con lại vô tình dạy lại ba mẹ.',
    'emotionalPromise', 'Tiếng cười ấm áp và cảm giác được thấu hiểu — không ai bị xấu hổ.',
    'uniqueValue', 'Kể chuyện nuôi dạy không phán xét, nơi cả ba mẹ và con cùng là nhân vật chính của hành trình.',
    'rules', jsonb_build_array(
      'NO_CHILD_HUMILIATION — trẻ không bị gắn nhãn “hư”',
      'Cha mẹ cũng có thể sai và thừa nhận điều đó',
      'Tiếng cười không đến từ việc làm trẻ xấu hổ',
      'Mỗi tập chỉ tập trung một thông điệp',
      'Không xây dựng thành viên gia đình như phản diện'
    )
  )
WHERE NOT EXISTS (SELECT 1 FROM projects);

INSERT INTO tasks (project_id, title, department, agent, priority, status)
SELECT p.id, v.title, v.department, v.agent, v.priority, v.status
FROM projects p,
(VALUES
  ('Hoàn thiện beat sheet Episode 01 — “Câu hỏi đầu tiên”', 'Story', 'INK — Story Analyst', 'HIGH', 'DOING'),
  ('Khóa Character Bible: Minh 5 tuổi', 'Visual', 'PAX — Character Designer', 'HIGH', 'TODO'),
  ('Xây Style Bible — 4 style candidates', 'Visual', 'VERA — Art Director', 'MEDIUM', 'TODO'),
  ('Danh sách location: nhà bếp, phòng khách, sân trường', 'World', 'NOVA — Studio Director', 'LOW', 'TODO')
) AS v(title, department, agent, priority, status)
WHERE p.name = 'The Little Explorer'
AND NOT EXISTS (SELECT 1 FROM tasks);

INSERT INTO activity (project_id, kind, message)
SELECT p.id, v.kind, v.message
FROM projects p,
(VALUES
  ('info', 'Project 001 được khởi tạo từ hai tài liệu IDEA'),
  ('agent', 'NOVA lập kiến trúc Season 1 — 13 tập, kết mở hành trình “trở thành anh”'),
  ('approve', 'Project Brief v1 được duyệt'),
  ('agent', 'INK bắt đầu viết beat sheet Episode 01')
) AS v(kind, message)
WHERE p.name = 'The Little Explorer'
AND NOT EXISTS (SELECT 1 FROM activity);