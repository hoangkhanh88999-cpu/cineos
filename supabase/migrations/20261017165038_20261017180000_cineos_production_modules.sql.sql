/*
# CINEOS production modules: story plan, script, storyboard, shots, prompts, takes, QC

1. New Tables (all single-tenant, no auth; RLS open to anon + authenticated)
- `scenes` — Scene Builder / Screenplay scene cards: episode_id, project_id, scene_number,
  slug, time, location_id, characters (uuid[]), costumes, props (uuid[]), objective,
  conflict, emotion_arc, action, dialogue (jsonb), continuity_in, continuity_out,
  screenplay (text), status (DRAFT/WRITING/REVIEW/LOCKED).
- `storyboard_frames` — one frame per shot suggestion: scene_id, frame_number, shot_suggestion,
  composition, pose, action, camera, dialogue, duration_s, image_url, status
  (PENDING/GENERATING/READY/APPROVED/REJECTED), annotations (text[]).
- `shots` — Shot Designer entity: scene_id, project_id, shot_code, episode_id, duration_s,
  character_ids uuid[], prop_ids uuid[], environment_id uuid, action, performance,
  expression, shot_size, camera_angle, lens, camera_movement, lighting, weather,
  dialogue, sound, start_state, end_state, storyboard_frame_id, generation_status,
  qc_status, approval_status.
- `master_prompts` — Prompt Engine compiled layers: shot_id, sections jsonb
  (character/action/environment/camera/lighting/style/motion), master_prompt,
  provider_prompts jsonb ({veo, kling, runway, image}).
- `takes` — Take Manager: shot_id, job_id nullable, take_number, status
  (QUEUED/GENERATING/COMPLETED/FAILED/QC_PROCESSING/REJECTED/SHORTLISTED/APPROVED/DEPRECATED),
  qc_scores jsonb (identity/costume/environment/motion/continuity/artifacts),
  qc_flags jsonb, image_url, is_favorite, selected boolean, cost numeric.
- `generation_jobs_prod` — Generation Manager rows bound to shots/takes: job_code, shot_id,
  type (IMAGE/VIDEO/VOICE/MUSIC/UPSCALE), model, provider, status
  (QUEUED/PROCESSING/COMPLETED/FAILED/CANCELLED), progress int, cost numeric, queued_at,
  completed_at. Reuses the global generation pipeline concept but scoped to shots.
- `qc_reviews` — AI QC Engine results: take_id, shot_id, scores jsonb, flags jsonb,
  overall text (PASS/WARN/FAIL), created_at.

2. Security
- RLS enabled on every new table.
- Four open policies per table (SELECT/INSERT/UPDATE/DELETE) TO anon, authenticated
  USING/WITH CHECK (true) — intentional: single-tenant studio app without sign-in.

3. Notes
- All statements idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS).
- Character/costume/prop/environment links are loose uuid references so partially
  defined worlds do not break scene or shot creation.
*/

CREATE TABLE IF NOT EXISTS scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid REFERENCES episodes(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  scene_number int NOT NULL DEFAULT 1,
  slug text NOT NULL DEFAULT 'INT. NEW SCENE',
  time text DEFAULT 'DAY',
  location_id uuid,
  characters uuid[] DEFAULT '{}',
  costumes text DEFAULT '',
  props uuid[] DEFAULT '{}',
  objective text DEFAULT '',
  conflict text DEFAULT '',
  emotion_arc text DEFAULT '',
  action text DEFAULT '',
  dialogue jsonb DEFAULT '[]',
  continuity_in text DEFAULT '',
  continuity_out text DEFAULT '',
  screenplay text DEFAULT '',
  status text NOT NULL DEFAULT 'DRAFT',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storyboard_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id uuid REFERENCES scenes(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  frame_number int NOT NULL DEFAULT 1,
  shot_suggestion text DEFAULT '',
  composition text DEFAULT '',
  pose text DEFAULT '',
  action text DEFAULT '',
  camera text DEFAULT '',
  dialogue text DEFAULT '',
  duration_s int DEFAULT 4,
  image_url text,
  status text NOT NULL DEFAULT 'PENDING',
  annotations text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id uuid REFERENCES scenes(id) ON DELETE CASCADE,
  storyboard_frame_id uuid,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  episode_id uuid,
  shot_code text NOT NULL,
  duration_s int DEFAULT 4,
  character_ids uuid[] DEFAULT '{}',
  prop_ids uuid[] DEFAULT '{}',
  environment_id uuid,
  action text DEFAULT '',
  performance text DEFAULT '',
  expression text DEFAULT '',
  shot_size text DEFAULT 'MEDIUM',
  camera_angle text DEFAULT 'EYE LEVEL',
  lens text DEFAULT '35MM',
  camera_movement text DEFAULT 'STATIC',
  lighting text DEFAULT 'NATURAL',
  weather text DEFAULT 'CLEAR',
  dialogue text DEFAULT '',
  sound text DEFAULT '',
  start_state text DEFAULT '',
  end_state text DEFAULT '',
  generation_status text DEFAULT 'NOT_READY',
  qc_status text DEFAULT 'PENDING',
  approval_status text DEFAULT 'PENDING',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS master_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shot_id uuid REFERENCES shots(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  sections jsonb DEFAULT '{}'::jsonb,
  master_prompt text DEFAULT '',
  provider_prompts jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS takes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shot_id uuid REFERENCES shots(id) ON DELETE CASCADE,
  job_id uuid,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  take_number int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'QUEUED',
  qc_scores jsonb DEFAULT '{}'::jsonb,
  qc_flags jsonb DEFAULT '[]'::jsonb,
  image_url text,
  is_favorite boolean DEFAULT false,
  selected boolean DEFAULT false,
  cost numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generation_jobs_prod (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_code text NOT NULL,
  shot_id uuid REFERENCES shots(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'VIDEO',
  model text NOT NULL DEFAULT 'AUTO',
  provider text NOT NULL DEFAULT 'AUTO',
  status text NOT NULL DEFAULT 'QUEUED',
  progress int DEFAULT 0,
  cost numeric(10,2) DEFAULT 0,
  queued_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS qc_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  take_id uuid REFERENCES takes(id) ON DELETE CASCADE,
  shot_id uuid REFERENCES shots(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  scores jsonb DEFAULT '{}'::jsonb,
  flags jsonb DEFAULT '[]'::jsonb,
  overall text NOT NULL DEFAULT 'PASS',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboard_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE shots ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE takes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs_prod ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_select_scenes" ON scenes;
CREATE POLICY "open_select_scenes" ON scenes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "open_insert_scenes" ON scenes;
CREATE POLICY "open_insert_scenes" ON scenes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "open_update_scenes" ON scenes;
CREATE POLICY "open_update_scenes" ON scenes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_delete_scenes" ON scenes;
CREATE POLICY "open_delete_scenes" ON scenes FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "open_select_storyboard_frames" ON storyboard_frames;
CREATE POLICY "open_select_storyboard_frames" ON storyboard_frames FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "open_insert_storyboard_frames" ON storyboard_frames;
CREATE POLICY "open_insert_storyboard_frames" ON storyboard_frames FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "open_update_storyboard_frames" ON storyboard_frames;
CREATE POLICY "open_update_storyboard_frames" ON storyboard_frames FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_delete_storyboard_frames" ON storyboard_frames;
CREATE POLICY "open_delete_storyboard_frames" ON storyboard_frames FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "open_select_shots" ON shots;
CREATE POLICY "open_select_shots" ON shots FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "open_insert_shots" ON shots;
CREATE POLICY "open_insert_shots" ON shots FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "open_update_shots" ON shots;
CREATE POLICY "open_update_shots" ON shots FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_delete_shots" ON shots;
CREATE POLICY "open_delete_shots" ON shots FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "open_select_master_prompts" ON master_prompts;
CREATE POLICY "open_select_master_prompts" ON master_prompts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "open_insert_master_prompts" ON master_prompts;
CREATE POLICY "open_insert_master_prompts" ON master_prompts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "open_update_master_prompts" ON master_prompts;
CREATE POLICY "open_update_master_prompts" ON master_prompts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_delete_master_prompts" ON master_prompts;
CREATE POLICY "open_delete_master_prompts" ON master_prompts FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "open_select_takes" ON takes;
CREATE POLICY "open_select_takes" ON takes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "open_insert_takes" ON takes;
CREATE POLICY "open_insert_takes" ON takes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "open_update_takes" ON takes;
CREATE POLICY "open_update_takes" ON takes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_delete_takes" ON takes;
CREATE POLICY "open_delete_takes" ON takes FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "open_select_generation_jobs_prod" ON generation_jobs_prod;
CREATE POLICY "open_select_generation_jobs_prod" ON generation_jobs_prod FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "open_insert_generation_jobs_prod" ON generation_jobs_prod;
CREATE POLICY "open_insert_generation_jobs_prod" ON generation_jobs_prod FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "open_update_generation_jobs_prod" ON generation_jobs_prod;
CREATE POLICY "open_update_generation_jobs_prod" ON generation_jobs_prod FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_delete_generation_jobs_prod" ON generation_jobs_prod;
CREATE POLICY "open_delete_generation_jobs_prod" ON generation_jobs_prod FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "open_select_qc_reviews" ON qc_reviews;
CREATE POLICY "open_select_qc_reviews" ON qc_reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "open_insert_qc_reviews" ON qc_reviews;
CREATE POLICY "open_insert_qc_reviews" ON qc_reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "open_update_qc_reviews" ON qc_reviews;
CREATE POLICY "open_update_qc_reviews" ON qc_reviews FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_delete_qc_reviews" ON qc_reviews;
CREATE POLICY "open_delete_qc_reviews" ON qc_reviews FOR DELETE TO anon, authenticated USING (true);
