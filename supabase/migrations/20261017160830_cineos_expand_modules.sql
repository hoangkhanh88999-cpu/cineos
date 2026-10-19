/*
# CINEOS — expand schema: characters, relationships, world, episodes, agents, approvals, generations, costs

1. New Tables
- `agents` — AI crew roster: name, role, department, accent color, state, context note.
- `characters` — project cast: project_id, code, name, role, archetype, personality, appearance jsonb, voice jsonb, story jsonb, status, version.
- `character_relationships` — edges between characters: from/to character, type, strength, conflict, history.
- `locations` — world tree: project_id, parent_id (self fk), name, description, palette, lighting.
- `props` — prop library: project_id, code, name, owner, location, condition, notes.
- `episode_beats` — story engine beats per episode.
- `approvals` — approval center: title, kind, payload jsonb, status, priority.
- `generation_jobs` — generation queue: code, type, model, status, progress, cost.
- `cost_events` — cost log: category, amount, note.

2. Modified Tables
- `episodes`: add theme, character_focus, script_progress, production_progress.

3. Security
- RLS enabled on all new tables; policies TO anon, authenticated USING (true) — intentionally shared single-tenant data.

4. Notes
- Idempotent. Seeds: agents roster, demo characters/relationships/locations/props/episodes/approvals/generations/costs for project 001.
*/

CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  department text,
  accent text NOT NULL DEFAULT '#8A78FF',
  state text NOT NULL DEFAULT 'IDLE',
  context_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  role text,
  archetype text,
  personality text,
  appearance jsonb,
  voice jsonb,
  story jsonb,
  status text NOT NULL DEFAULT 'DRAFT',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS character_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_character uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  to_character uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  type text NOT NULL,
  strength integer NOT NULL DEFAULT 3,
  conflict text,
  history text
);
ALTER TABLE character_relationships ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  palette text,
  lighting text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS props (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  owner_character text,
  location text,
  condition text NOT NULL DEFAULT 'CLEAN',
  notes text
);
ALTER TABLE props ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS episode_beats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  position integer NOT NULL,
  kind text NOT NULL,
  text text NOT NULL
);
ALTER TABLE episode_beats ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  kind text NOT NULL,
  payload jsonb,
  status text NOT NULL DEFAULT 'PENDING',
  priority text NOT NULL DEFAULT 'P2',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code text NOT NULL,
  type text NOT NULL,
  model text,
  status text NOT NULL DEFAULT 'QUEUED',
  progress integer,
  cost numeric(10,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS cost_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric(10,4) NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE cost_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE episodes ADD COLUMN IF NOT EXISTS theme text;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS character_focus text;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS script_progress integer NOT NULL DEFAULT 0;
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS production_progress integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);
CREATE INDEX IF NOT EXISTS idx_locations_project ON locations(project_id);
CREATE INDEX IF NOT EXISTS idx_props_project ON props(project_id);
CREATE INDEX IF NOT EXISTS idx_approvals_project ON approvals(project_id);
CREATE INDEX IF NOT EXISTS idx_genjobs_project ON generation_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_project ON cost_events(project_id);

DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['agents','characters','character_relationships','locations','props','episode_beats','approvals','generation_jobs','cost_events']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "shared_read" ON %I', t);
    EXECUTE format('CREATE POLICY "shared_read" ON %I FOR SELECT TO anon, authenticated USING (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "shared_write" ON %I', t);
    EXECUTE format('CREATE POLICY "shared_write" ON %I FOR INSERT TO anon, authenticated WITH CHECK (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "shared_update" ON %I', t);
    EXECUTE format('CREATE POLICY "shared_update" ON %I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "shared_delete" ON %I', t);
    EXECUTE format('CREATE POLICY "shared_delete" ON %I FOR DELETE TO anon, authenticated USING (true)', t);
  END LOOP;
END $$;

INSERT INTO agents (name, role, department, accent, state, context_note)
SELECT v.name, v.role, v.department, v.accent, v.state, v.context_note FROM (VALUES
  ('NOVA','Studio Director','Executive','#8A78FF','WORKING','Coordinating Project 001'),
  ('ARIA','Creative Producer','Development','#C084FC','THINKING','Project Brief — Project 001'),
  ('INK','Screenwriter','Story','#F472B6','WORKING','Episode 01 — beat sheet'),
  ('LENS','Cinematographer','Production','#62A0FF','IDLE',NULL),
  ('FRAME','Storyboard Artist','Production','#F0BB62','IDLE',NULL),
  ('CUT','Editor','Post','#55D79B','IDLE',NULL),
  ('ECHO','Sound Director','Post','#5E9DFF','IDLE',NULL),
  ('GUARD','QC / Continuity','QC','#FF6D75','REVIEWING','2 shots queued')
) AS v(name,role,department,accent,state,context_note)
WHERE NOT EXISTS (SELECT 1 FROM agents);

INSERT INTO characters (project_id, code, name, role, archetype, personality, appearance, story, status)
SELECT p.id, v.code, v.name, v.role, v.archetype, v.personality, v.appearance::jsonb, v.story::jsonb, v.status
FROM projects p, (VALUES
  ('CHAR_0001','Cậu Bé (Minh)','Trung tâm cảm xúc','The Innocent Logic',
   'Tò mò, thích hỏi tại sao, đôi khi ích kỷ, logic thẳng và nhất quán — nhìn thế giới người lớn qua đôi mắt trẻ con.',
   '{"height":"105 cm","face":"Tròn, má phính","hair":"Đen ngắn, tóc mai dựng","eyes":"Nâu sáng","distinctive":"Nụ cười với một răng cửa mới mọc"}',
   '{"desires":"Hiểu thế giới vận hành thế nào","fears":"Bị nói con còn nhỏ","arc":"Từ hỏi tại sao → tự tìm câu trả lời"}',
   'APPROVED'),
  ('CHAR_0002','Ba (Hùng)','Nguồn comedy','The Overconfident Dad',
   'Tự tin quá mức, thích nghĩ mình có giải pháp tối ưu, đôi lúc phá luật chính mình đặt ra, yêu con bằng cách "dạy" con.',
   '{"height":"172 cm","face":"Vuông, râu cước ngắn","hair":"Đen, chải ngược","distinctive":"Luôn có điện thoại trong tay"}',
   '{"desires":"Dạy con đúng cách","fears":"Con xem thường mình","arc":"Ba phải dạy con → Ba cần hiểu con → Ba cũng cần sửa mình"}',
   'REVIEW'),
  ('CHAR_0003','Mẹ (Lan)','Neo cảm xúc','The Watchful Mom',
   'Quan sát tốt, hiểu con nhanh, nhưng không phải luôn đúng — cũng có lúc áp đặt, mệt mỏi, làm thay con.',
   '{"height":"160 cm","face":"Ô van, dịu","hair":"Nâu tối, buộc gọn","distinctive":"Vòng tay mảnh đeo tay trái"}',
   '{"desires":"Gia đình ấm áp","fears":"Làm con tổn thương","arc":"Học cách tin con và tự báo lỗi khi sai"}',
   'DRAFT')
) AS v(code,name,role,archetype,personality,appearance,story,status)
WHERE p.name = 'The Little Explorer'
AND NOT EXISTS (SELECT 1 FROM characters);

INSERT INTO character_relationships (project_id, from_character, to_character, type, strength, conflict, history)
SELECT c1.project_id, c1.id, c2.id, v.type, v.strength, v.conflict, v.history
FROM (VALUES
  ('CHAR_0001','CHAR_0002','Con — Ba',4,'Bé dùng chính lời ba dạy để phản biện ba','EP01: vụ điện thoại'),
  ('CHAR_0001','CHAR_0003','Con — Mẹ',5,'Mẹ hay làm thay điều bé đáng tự làm','EP03: lời xin lỗi đầu tiên'),
  ('CHAR_0002','CHAR_0003','Ba — Mẹ',5,'Ba tự tin quá, mẹ phải "dọn bãi chiến trường"','Cưới nhau 7 năm')
) AS v(from_code,to_code,type,strength,conflict,history)
JOIN characters c1 ON c1.code = v.from_code
JOIN characters c2 ON c2.code = v.to_code
WHERE NOT EXISTS (SELECT 1 FROM character_relationships);

INSERT INTO locations (project_id, parent_id, name, description, palette, lighting)
SELECT p.id, NULL, v.name, v.description, v.palette, v.lighting
FROM projects p, (VALUES
  ('Nhà','Căn nhà nhỏ 2 tầng — nơi phần lớn câu chuyện diễn ra','Warm cream + wood','Tự nhiên ban ngày, vàng ấm buổi tối'),
  ('Trường Mầm non','Sân phơi nắng, lớp học nhiều màu','Pastel + green','Nắng sáng gay gắt'),
  ('Công viên','Chỗ ba con đi chơi cuối tuần','Sky blue + green','Chiều tà')
) AS v(name,description,palette,lighting)
WHERE p.name = 'The Little Explorer'
AND NOT EXISTS (SELECT 1 FROM locations);

INSERT INTO locations (project_id, parent_id, name, description)
SELECT l.project_id, l.id, v.name, v.description
FROM locations l, (VALUES
  ('Phòng khách','Ghế sofa màu be, TV tường, chỗ ba ngồi xem điện thoại'),
  ('Nhà bếp','Bàn ăn gia đình — nơi nhiều xung đột vui xảy ra'),
  ('Phòng ngủ của bé','Giường themed xe hơi, kệ đồ chơi')
) AS v(name,description)
WHERE l.name = 'Nhà'
AND NOT EXISTS (SELECT 1 FROM locations l2 WHERE l2.parent_id IS NOT NULL);

INSERT INTO props (project_id, code, name, owner_character, location, condition, notes)
SELECT p.id, v.code, v.name, v.owner, v.location, v.condition, v.notes
FROM projects p, (VALUES
  ('PROP_0001','Điện thoại của Ba','Ba','Phòng khách','CLEAN','Vật gây "vụ án" EP01'),
  ('PROP_0002','Khủng long nhồi bông','Cậu Bé','Phòng ngủ của bé','CLEAN','Bạn thân của bé'),
  ('PROP_0003','Ảnh gia đình','Gia đình','Phòng khách','CLEAN','Treo tường cầu thang')
) AS v(code,name,owner,location,condition,notes)
WHERE p.name = 'The Little Explorer'
AND NOT EXISTS (SELECT 1 FROM props);

INSERT INTO episodes (project_id, number, title, logline, status, theme, character_focus, script_progress, production_progress)
SELECT p.id, v.number, v.title, v.logline, v.status, v.theme, v.focus, v.sp, v.pp
FROM projects p, (VALUES
  (1,'Điện thoại của ai?','Cậu bé hỏi ba bao nhiêu tuổi thì được xem điện thoại — và phát hiện luật của ba không nhất quán.','WRITING','Luật áp cho người khác cũng phải áp cho mình','Cậu Bé, Ba',60,0),
  (2,'Đồ chơi tự dọn được thì tốt','Bé đòi chế tạo "máy dọn đồ chơi" — ba hưởng ứng hết mình, kết quả bết dính.','OUTLINE','Trước khi đòi người khác, hãy tự thử','Cậu Bé',20,0),
  (3,'Lời xin lỗi đầu tiên','Mẹ phát hiện mình vừa làm thay điều con đáng tự làm.','OUTLINE','Xin lỗi không làm ai bé đi','Mẹ',10,0),
  (4,'Ai đang giận ai?','Bé giận ba, nhưng chính ba cũng đang giận bé — và không ai nhớ vì sao.','IDEA','Giận là thứ cần gọi tên',NULL,0,0)
) AS v(number,title,logline,status,theme,focus,sp,pp)
WHERE p.name = 'The Little Explorer'
AND NOT EXISTS (SELECT 1 FROM episodes);

INSERT INTO approvals (project_id, title, kind, payload, status, priority)
SELECT p.id, v.title, v.kind, v.payload::jsonb, v.status, v.priority
FROM projects p, (VALUES
  ('Ba (Hùng) — Character v02','CHARACTER','{"changes":["Râu cước ngắn hơn","Điện thoại luôn trong tay"]}','PENDING','P1'),
  ('Visual Style — 4 candidates','STYLE','{"candidates":["A: 3D pastel","B: 2D hand-drawn","C: cinematic 3D","D: paper cut"]}','PENDING','P2')
) AS v(title,kind,payload,status,priority)
WHERE p.name = 'The Little Explorer'
AND NOT EXISTS (SELECT 1 FROM approvals);

INSERT INTO generation_jobs (project_id, code, type, model, status, progress, cost)
SELECT p.id, v.code, v.type, v.model, v.status, v.progress, v.cost
FROM projects p, (VALUES
  ('CHAR_0002_v02','IMAGE','Image Model','COMPLETED',NULL,0.08),
  ('EP01_STORYBOARD_03','IMAGE','Image Model','RUNNING',40,0.05),
  ('EP01_SC01_SH02','VIDEO','Video Model','QC',NULL,1.42)
) AS v(code,type,model,status,progress,cost)
WHERE p.name = 'The Little Explorer'
AND NOT EXISTS (SELECT 1 FROM generation_jobs);

INSERT INTO cost_events (project_id, category, amount, note)
SELECT p.id, v.category, v.amount, v.note
FROM projects p, (VALUES
  ('VIDEO',1.42,'EP01_SC01_SH02 — Video Model'),
  ('IMAGE',0.13,'Character + storyboard generations'),
  ('LLM',0.06,'INK — beat sheet pass')
) AS v(category,amount,note)
WHERE p.name = 'The Little Explorer'
AND NOT EXISTS (SELECT 1 FROM cost_events);