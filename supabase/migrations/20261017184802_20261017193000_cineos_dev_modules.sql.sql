/*
# CINEOS: idea lab, research room, costume studio, environment studio, model router

1. New Tables (single-tenant, no auth; RLS open to anon + authenticated)
- `ideas` — Idea Lab: text nội dung, phân tích AI (premise/theme/audience/hook/
  opportunities/risks), status (DRAFT/ANALYZED/VARIANT/MERGED/LOCKED), parent_id cho variant.
- `research_topics` — Research Room: topic, findings text, sources text[], relevance,
  used_in text[], reliability int 0-100, notes.
- `costumes` — Costume Studio: character_id, slot (HOME/SCHOOL/OUTDOOR/SLEEPWEAR/SPECIAL),
  name, description, state (CLEAN/WET/DIRTY/DAMAGED), locked bool.
- `environments` — Environment Studio: location_id, overview, architecture, furniture,
  palette, lighting, camera_angles text[], time_variants text[], references text[],
  version int.
- `model_registry` — AI Model Router: name, type (LLM/IMAGE/VIDEO/VOICE/MUSIC),
  provider, quality int, cost_per_unit numeric, speed, reference_url, duration_note,
  availability (AVAILABLE/BETA/DOWN).

2. Security: RLS enabled + 4 open policies mỗi bảng TO anon, authenticated.

3. Seed dữ liệu mẫu cho project "The Little Explorer".
*/

CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  premise text,
  theme text,
  audience text,
  hook text,
  opportunities text,
  risks text,
  status text NOT NULL DEFAULT 'DRAFT',
  parent_id uuid REFERENCES ideas(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS research_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  topic text NOT NULL,
  findings text,
  sources text[] DEFAULT '{}',
  relevance text,
  used_in text[] DEFAULT '{}',
  reliability int NOT NULL DEFAULT 50,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS costumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  slot text NOT NULL,
  name text NOT NULL,
  description text,
  state text NOT NULL DEFAULT 'CLEAN',
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS environments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  overview text,
  architecture text,
  furniture text,
  palette text,
  lighting text,
  camera_angles text[] DEFAULT '{}',
  time_variants text[] DEFAULT '{}',
  references_note text,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS model_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  quality int NOT NULL DEFAULT 70,
  cost_per_unit numeric NOT NULL DEFAULT 0,
  speed text,
  reference_url text,
  duration_note text,
  availability text NOT NULL DEFAULT 'AVAILABLE',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE costumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_registry ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ideas','research_topics','costumes','environments','model_registry'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "open_select_%1$s" ON %1$I', t);
    EXECUTE format('CREATE POLICY "open_select_%1$s" ON %1$I FOR SELECT TO anon, authenticated USING (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "open_insert_%1$s" ON %1$I', t);
    EXECUTE format('CREATE POLICY "open_insert_%1$s" ON %1$I FOR INSERT TO anon, authenticated WITH CHECK (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "open_update_%1$s" ON %1$I', t);
    EXECUTE format('CREATE POLICY "open_update_%1$s" ON %1$I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "open_delete_%1$s" ON %1$I', t);
    EXECUTE format('CREATE POLICY "open_delete_%1$s" ON %1$I FOR DELETE TO anon, authenticated USING (true)', t);
  END LOOP;
END $$;

/* =============================== SEED =============================== */

INSERT INTO ideas (project_id, title, body, premise, theme, audience, hook, opportunities, risks, status)
SELECT p.id, v.title, v.body, v.premise, v.theme, v.audience, v.hook, v.opps, v.risks, v.status
FROM projects p
CROSS JOIN (VALUES
  ('Ý TƯỞNG GỐC — Quỹ thời gian của ba', 'Một người ba bận rộn học cách chơi lại cuộc sống thường ngày qua lăng kính trí tưởng tượng của con trai 5 tuổi. Mỗi tập: một phiền phức thực tế biến thành nhiệm vụ phiêu lưu trong mắt bé. Theme xuyên suốt: thời gian dành cho con không phải chi phí — đó là món quà.', 'Bố bận rộn và con trai 5 tuổi biến những việc nhỏ trong nhà thành phiêu lưu.', 'Childhood lasts a heartbeat —_PARENTING qua con mắt trẻ thơ.', 'Phụ huynh 25-40 có con nhỏ, xem cùng bé 3-7.', 'Quỹ thời gian: ba trongилаvệcvà bé trong oyun — hai thế giới va nhau mỗi tập.', 'Format 7 phút dễ số hóa; dàn cảnh nhà chỉ cần 2-3 environment; mép comedy tự nhiên từ khoảng cách thế giới người lớn - trẻ thơ.', 'Dễ rơi vào công thức lặp; cận cảnh cảm xúc cần kịch bản thật tinh để không sến.', 'ANALYZED'),
  ('Biến thể A — Góc nhìn của bé dẫn truyện', 'Cùng premise nhưng máy quay luôn ở tầm mắt bé (110cm). Người lớn bị cắt đầu trong khung hình nửa đầu tập, chỉ lộ diện khi bé "nhìn thấy" họ thật sự. Craft: khán giả trải nghiệm đúng thế giới cảm quan của trẻ.', 'Bé dẫn truyện, người lớn là nhân vật phụ trong thế giới của bé.', 'Trí tưởng tượng của trẻ là ngôn ngữ hợp lệ.', 'Như gốc + educator theo dõi.', 'Quy tắc 110cm tạo signature look ngay từ giây đầu.', 'Signature look dễ viral trên vertical; giáo viên mầm non có thể dùng làm tài liệu.', 'Ràng buộc kỹ thuật cao cho storyboard; dễ mệt nếu lạm dụng hand-held.', 'VARIANT'),
  ('Biến thể B — Không lời, physical comedy', 'Bỏ hoàn toàn thoại, kể truyện bằng âm thanh + hành động thể chất kiểu Tom & Jerry hiện đại. Quốc tế hóa: không cần lồng tiếng cho từng thị trường.', 'Chỉ hành động + âm nhạc, không thoại.', 'Comedy không biên giới.', 'Toàn cầu, mọi lứa tuổi.', 'Không rào cản ngôn ngữ khi lên mạng.', 'Dễ thâm nhập thị trường quốc tế; chi phí voice = 0.', 'Mất lớp cảm xúc đối thoại — khó lấy nước mắt ở payoff.', 'VARIANT')
) AS v(title, body, premise, theme, audience, hook, opps, risks, status)
WHERE p.name LIKE '%Little Explorer%'
  AND NOT EXISTS (SELECT 1 FROM ideas i WHERE i.project_id = p.id);

INSERT INTO research_topics (project_id, topic, findings, sources, relevance, used_in, reliability, notes)
SELECT p.id, v.topic, v.findings, v.sources, v.relevance, v.used_in, v.rel, v.notes
FROM projects p
CROSS JOIN (VALUES
  ('Tâm lý trẻ 4-6 tuổi: cách trẻ xử lý thất vọng', 'Trẻ ở lứa tuổi này chuyển thất vọng thành trò chơi rất nhanh — "chữa cháy" bằng tưởng tượng là cơ chế thật, không phải huyễn hoặc của người lớn. Điều này biện minh cho twist "spill thành space mission".', ARRAY['Piaget — Play Dreams and Imitation', 'Zero to Three (nguồn tổng hợp)'], 'Biện minh cho toàn bộ trục story của series', ARRAY['Project Bible', 'EP01 SC02', 'EP01 SC03']::text[], 85, 'Cần trích dẫn chính xác khi trình netizen network.'),
  ('Thói quen xem của phụ huynh Việt Nam trên YouTube', 'Phụ huynh ưu tiên nội dung 5-8 phút, có payoff cảm xúc rõ, và nhân vật trẻ em nói tiếng Việt tự nhiên. Thumbnail có bé cười + một vật thể tưởng tượng tăng CTR.', ARRAY['YouTube Trend report VN', 'Quan sát fanpage cùng phân khúc'], 'Định dạng độ dài + thumbnail + ngôn ngữ nhân vật', ARRAY['Release Studio', 'Marketing']::text[], 70, 'Số liệu quan sát, chưa phải khảo sát chính thức.'),
  ('Ngôn ngữ hình thể của người ba mệt mỏi', 'Người mệt vẫn chơi được với con nếu trò chơi "không cần di chuyển nhiều" — đây là chi tiết thật giúp cảnh giấy - tên lửa giấy đáng tin. Áo choàng khăn tắm là chuyển thể hình thể tự nhiên.', ARRAY['Quan sát thực tế', 'Physical comedy references (Chaplin, Tati)'], 'Design chuyển động của BA trong mọi tập', ARRAY['Character Bible — BA', 'EP01 SC03']::text[], 90, 'Áp dụng nhất quán: BA không bao giờ nhảy hoặc chạy nhanh.')
) AS v(topic, findings, sources, relevance, used_in, rel, notes)
WHERE p.name LIKE '%Little Explorer%'
  AND NOT EXISTS (SELECT 1 FROM research_topics r WHERE r.project_id = p.id);

INSERT INTO costumes (project_id, character_id, slot, name, description, state, locked)
SELECT c.project_id, c.id, v.slot, v.name, v.description, v.state, v.locked
FROM characters c
JOIN (VALUES
  ('CHAR_0001', 'HOME', 'Sơ mi nhăn + quần tây', 'Sơ mi xanh nhạt hơi nhăn, thắt lưng lỏng — dấu hiệu người quá mệt để thay đồ sau làm việc.', 'CLEAN', true),
  ('CHAR_0001', 'SLEEPWEAR', 'Áo choàng khăn tắm', 'Khăn tắm cài kiểu dạo — xuất hiện sau khi áo sơ mi ướt sữa. Comedy costume chính của tập 1.', 'WET', false),
  ('CHAR_0002', 'HOME', 'Đồ ngủ in tên lửa', 'Đồ ngủ cotton in hình tên lửa — chứng minh niềm đam mê của bé, không cần thoại.', 'CLEAN', true),
  ('CHAR_0002', 'SCHOOL', 'Đồng phục mầm non', 'Áo trắng cổ tròn + quần short đùi xanh. Chỉ xuất hiện đoạn cuối khi chuẩn bị đi học.', 'CLEAN', false),
  ('CHAR_0002', 'SPECIAL', 'Bộ phi hành gia giấy', 'Tự chế từ giấy + băng dính trong tập 1. Đây là "special outfit" hero của cả series.', 'DAMAGED', false),
  ('CHAR_0003', 'OUTDOOR', 'Áo khoác dạ dài', 'Cô giáo / người hàng xóm — tông màu trầm để nhân vật bé nổi bật trong khung.', 'CLEAN', true)
) AS v(code, slot, name, description, state, locked)
  ON c.code = v.code
WHERE NOT EXISTS (SELECT 1 FROM costumes k WHERE k.character_id = c.id);

INSERT INTO environments (project_id, location_id, overview, architecture, furniture, palette, lighting, camera_angles, time_variants, references_note, version)
SELECT e.project_id, e.id, v.overview, v.architecture, v.furniture, v.palette, v.lighting, v.camera_angles, v.time_variants, v.references_note, 1
FROM locations e
JOIN (VALUES
  ('Nhà bếp là trái tim của ngôi nhà — nơi mọi phiền phức và mọi khoảnh khắc ấm bắt đầu. Cửa sổ lớn đón nắng sáng, bàn ăn gỗ trung tâm.', 'Kịch trần nhà chung cư hiện đại, mặt đá bếp sáng, tủ thấp có tay nắm ngang — tầm với của trẻ.', 'Bàn gỗ 4 ghế, lò vi sóng, lò nướng âm, đống giấy tờ của ba góc bàn (chi tiết kể chuyện).', 'Nền gỗ vàng nhạt + tường kem + điểm nhấn cam đồ chơi.', 'Nắng sáng chiếu chếch qua cửa sổ tạo vệt sáng dài trên bàn — vệt này là "sân khấu" của vụ đổ sữa.', ARRAY['WIDE - từ cửa bếp', 'HIGH ANGLE - nhìn xuống mặt bàn', 'CHILD EYE - 110cm']::text[], ARRAY['MORNING - nắng vàng ấm', 'EVENING - đèn bếp vàng ấm']::text[], 'Ghibli interior warmth × Pixar kitchen staging', 1),
  ('Phòng khách là sân khấu tưởng tượng — sàn trống rộng để hai bố con dựng "trạm phóng".', 'Sàn gỗ, sofa vải be, kệ sách thấp, cửa ban công kính.', 'Sofa 3 chỗ, thảm tròn, hộp đồ chơi mở, chiếu折叠 góc phòng.', 'Tông be - nâu ấm, điểm xanh lá từ cây cảnh.', 'Nắng khuếch tán buổi trưa — dịu hơn bếp, phù hợp interval tăng tưởng.', ARRAY['WIDE - từ sofa ra cửa sổ', 'LOW ANGLE - đặt trên sàn nhìn lên hai bố con']::text[], ARRAY['MID-DAY - khuếch tán', 'AFTERNOON - vàng nhẹ']::text[], 'Ghibli empty-floor staging × Pixar prop comedy', 1)
) AS v(overview, architecture, furniture, palette, lighting, camera_angles, time_variants, references_note, version)
  ON e.name LIKE '% bếp%' OR e.name ILIKE '%kitchen%' OR e.name ILIKE '%phòng khách%' OR e.name ILIKE '%living%'
WHERE e.project_id = (SELECT id FROM projects WHERE name LIKE '%Little Explorer%')
  AND NOT EXISTS (SELECT 1 FROM environments en WHERE en.location_id = e.id);

INSERT INTO model_registry (project_id, name, type, provider, quality, cost_per_unit, speed, reference_url, duration_note, availability)
SELECT p.id, v.name, v.type, v.provider, v.quality, v.cost, v.speed, v.reference_url, v.duration_note, v.availability
FROM projects p
CROSS JOIN (VALUES
  ('Nova LLM', 'LLM', 'OpenAI', 90, 0.008, 'Fast (~2s/1k tokens)', NULL, 'Viết kịch bản, phân tích idea, Nova chat', 'AVAILABLE'),
  ('Writer LLM', 'LLM', 'Anthropic', 88, 0.009, 'Fast', NULL, 'Screenplay dài, giữ voice nhân vật', 'AVAILABLE'),
  ('Image Gen XL', 'IMAGE', 'Flux', 85, 0.04, '~8s/ảnh', NULL, 'Character sheet, environment, storyboard frame', 'AVAILABLE'),
  ('Image Gen Real', 'IMAGE', 'Flux Pro', 92, 0.06, '~12s/ảnh', NULL, 'Hero frame, poster', 'AVAILABLE'),
  ('Video Gen V2', 'VIDEO', 'Runway', 82, 0.35, '~60s/clip 5s', '5s/clip', 'Shot generation chính', 'AVAILABLE'),
  ('Video Gen Cinematic', 'VIDEO', 'Kling', 88, 0.50, '~90s/clip 5s', '5s/clip', 'Shot phức tạp có camera move', 'BETA'),
  ('Voice TTS VN', 'VOICE', 'ElevenLabs', 86, 0.02, '~1s/giây thoại', NULL, 'Dialogue tiếng Việt', 'AVAILABLE'),
  ('Voice TTS Kid', 'VOICE', 'ElevenLabs', 80, 0.03, '~1.5s/giây thoại', NULL, 'Giọng trẻ em — cần QC kỹ', 'BETA'),
  ('Music Gen', 'MUSIC', 'Suno', 78, 0.05, '~30s/track', '30-120s/track', 'Theme + music cue', 'AVAILABLE')
) AS v(name, type, provider, quality, cost, speed, reference_url, duration_note, availability)
WHERE p.name LIKE '%Little Explorer%'
  AND NOT EXISTS (SELECT 1 FROM model_registry m WHERE m.project_id = p.id);
