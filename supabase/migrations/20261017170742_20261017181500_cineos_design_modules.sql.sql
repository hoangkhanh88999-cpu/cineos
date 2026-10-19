/*
# CINEOS design modules: timeline, visual style lab, cinematography bible

1. New Tables (single-tenant, no auth; RLS open to anon + authenticated)
- `style_candidates` — Visual Style Lab: 4 candidates (A-D) per project with attributes
  rendering/realism(0-100)/lighting/palette/texture/camera/motion/composition,
  reference_note, status CANDIDATE | LOCKED. Locking one unlocks the others.
- `cinematography_presets` — Cinematography Bible: 5 presets (INTIMATE, COMEDY, EMOTIONAL,
  ACTION, ESTABLISHING) each with lens, shot_scale, camera_height, movement, lighting,
  depth, duration, use_case.

2. Security
- RLS enabled; four open policies per table TO anon, authenticated USING/WITH CHECK (true)
  — intentional single-tenant studio app.

3. Seed data (PROJECT 001 "The Little Explorer")
- Style candidates A-D: Warm 2D-3D hybrid / Soft pastel watercolor / Bright 3D animation /
  Cinematic painterly. Candidate A locked by default as the working style.
- Five cinematography presets tuned for family animation.
*/

CREATE TABLE IF NOT EXISTS style_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  tagline text,
  rendering text,
  realism int DEFAULT 70,
  lighting text,
  palette text,
  texture text,
  camera text,
  motion text,
  composition text,
  reference_note text,
  status text NOT NULL DEFAULT 'CANDIDATE',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cinematography_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  lens text,
  shot_scale text,
  camera_height text,
  movement text,
  lighting text,
  depth text,
  duration text,
  use_case text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE style_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cinematography_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_select_style_candidates" ON style_candidates;
CREATE POLICY "open_select_style_candidates" ON style_candidates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "open_insert_style_candidates" ON style_candidates;
CREATE POLICY "open_insert_style_candidates" ON style_candidates FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "open_update_style_candidates" ON style_candidates;
CREATE POLICY "open_update_style_candidates" ON style_candidates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_delete_style_candidates" ON style_candidates;
CREATE POLICY "open_delete_style_candidates" ON style_candidates FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "open_select_cinematography_presets" ON cinematography_presets;
CREATE POLICY "open_select_cinematography_presets" ON cinematography_presets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "open_insert_cinematography_presets" ON cinematography_presets;
CREATE POLICY "open_insert_cinematography_presets" ON cinematography_presets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "open_update_cinematography_presets" ON cinematography_presets;
CREATE POLICY "open_update_cinematography_presets" ON cinematography_presets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "open_delete_cinematography_presets" ON cinematography_presets;
CREATE POLICY "open_delete_cinematography_presets" ON cinematography_presets FOR DELETE TO anon, authenticated USING (true);

-- Seed style candidates for PROJECT 001 if none exist yet
INSERT INTO style_candidates (project_id, name, tagline, rendering, realism, lighting, palette, texture, camera, motion, composition, reference_note, status)
SELECT p.id, v.name, v.tagline, v.rendering, v.realism, v.lighting, v.palette, v.texture, v.camera, v.motion, v.composition, 'Studio Ghibli warmth × Pixar polish × hand-painted textures', v.status
FROM projects p
CROSS JOIN (VALUES
  ('Style Candidate A', 'Warm 2D-3D hybrid — hand-painted heart', 'Painterly 2D textures over soft 3D geometry', 62, 'Golden-hour warm key with soft bounce', 'Warm amber + cream', 'Brushed watercolor grain', '35mm feel, gentle pushes', 'Smooth, rounded, 24fps with 2s on 2s accents', 'Centered, child-height framing', 'LOCKED'),
  ('Style Candidate B', 'Soft pastel watercolor storybook', 'Full 2D watercolor wash, ink outlines', 45, 'Diffuse overcast daylight', 'Soft pastel daylight', 'Paper fiber texture', 'Flat, storybook static frames', 'Gentle fades, paper-cut moves', 'Wide negative space', 'CANDIDATE'),
  ('Style Candidate C', 'Bright modern 3D animation', 'Glossy stylized 3D, subsurface skin', 78, 'High-key studio lighting', 'High-key bright', 'Clean smooth surfaces', 'Virtual camera, 28mm wide feel', 'Snappy 12fps stylized snaps', 'Dynamic diagonals', 'CANDIDATE'),
  ('Style Candidate D', 'Cinematic painterly feature look', 'Painterly 3D with volumetric depth', 85, 'Golden hour + teal shadows', 'Golden hour + teal shadow', 'Oil-paint impasto accents', 'Anamorphic 40mm, shallow', 'Weighted cinematic easing', 'Rule-of-thirds wide vistas', 'CANDIDATE')
) AS v(name, tagline, rendering, realism, lighting, palette, texture, camera, motion, composition, status)
WHERE p.name = 'PROJECT 001 — The Little Explorer'
  AND NOT EXISTS (SELECT 1 FROM style_candidates sc WHERE sc.project_id = p.id);

-- Seed cinematography presets for PROJECT 001
INSERT INTO cinematography_presets (project_id, name, lens, shot_scale, camera_height, movement, lighting, depth, duration, use_case)
SELECT p.id, v.name, v.lens, v.shot_scale, v.camera_height, v.movement, v.lighting, v.depth, v.duration, v.use_case
FROM projects p
CROSS JOIN (VALUES
  ('INTIMATE', '85mm', 'Medium Close to Close-Up', 'Child eye level (110cm)', 'Static or micro push-in', 'Soft warm key, gentle falloff', 'Shallow — isolate emotion', '6-10s', 'Quiet emotional beats: apology, realization, hug'),
  ('COMEDY', '24mm', 'Medium Wide', 'Eye level, slightly low', 'Snap whip-pans, reframe gags', 'Bright flat, high fill', 'Deep — read full body business', '2-4s', 'Physical comedy, milk-spill chaos, reaction chains'),
  ('EMOTIONAL', '50mm', 'Medium', 'Eye level', 'Slow dolly out', 'Golden hour rim + haze', 'Medium — hold both faces', '8-14s', 'Payoff moments, parent-child connection, montage endings'),
  ('ACTION', '35mm', 'Wide to Medium', 'Tracking height', 'Handheld tracking', 'High contrast, moving shadows', 'Deep with foreground parallax', '1-3s', 'Chase beats: toy rocket retrieval, sock-slide rescue'),
  ('ESTABLISHING', '14mm', 'Extreme Wide', 'High angle / drone', 'Slow crane or drift', 'Natural ambient, big sky', 'Full deep focus', '4-6s', 'Scene transitions: home exterior, neighborhood, sunset street')
) AS v(name, lens, shot_scale, camera_height, movement, lighting, depth, duration, use_case)
WHERE p.name = 'PROJECT 001 — The Little Explorer'
  AND NOT EXISTS (SELECT 1 FROM cinematography_presets cp WHERE cp.project_id = p.id);
