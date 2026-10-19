import type { EntityStatus } from './types';

export interface Scene {
  id: string;
  episode_id: string | null;
  project_id: string;
  scene_number: number;
  slug: string;
  time: string | null;
  location_id: string | null;
  characters: string[];
  costumes: string | null;
  props: string[];
  objective: string | null;
  conflict: string | null;
  emotion_arc: string | null;
  action: string | null;
  dialogue: { character: string; line: string }[] | null;
  continuity_in: string | null;
  continuity_out: string | null;
  screenplay: string | null;
  status: EntityStatus;
  created_at: string;
}

export interface StoryboardFrame {
  id: string;
  scene_id: string;
  project_id: string;
  frame_number: number;
  shot_suggestion: string | null;
  composition: string | null;
  pose: string | null;
  action: string | null;
  camera: string | null;
  dialogue: string | null;
  duration_s: number;
  image_url: string | null;
  status: 'PENDING' | 'GENERATING' | 'READY' | 'APPROVED' | 'REJECTED';
  annotations: string[];
  created_at: string;
}

export interface Shot {
  id: string;
  scene_id: string | null;
  storyboard_frame_id: string | null;
  project_id: string;
  episode_id: string | null;
  shot_code: string;
  duration_s: number;
  character_ids: string[];
  prop_ids: string[];
  environment_id: string | null;
  action: string | null;
  performance: string | null;
  expression: string | null;
  shot_size: string;
  camera_angle: string;
  lens: string;
  camera_movement: string;
  lighting: string;
  weather: string;
  dialogue: string | null;
  sound: string | null;
  start_state: string | null;
  end_state: string | null;
  generation_status: string;
  qc_status: string;
  approval_status: EntityStatus;
  created_at: string;
}

export interface MasterPrompt {
  id: string;
  shot_id: string;
  project_id: string;
  sections: Record<string, string>;
  master_prompt: string;
  provider_prompts: Record<string, string>;
  created_at: string;
}

export interface Take {
  id: string;
  shot_id: string;
  job_id: string | null;
  project_id: string;
  take_number: number;
  status:
    | 'QUEUED'
    | 'GENERATING'
    | 'COMPLETED'
    | 'FAILED'
    | 'QC_PROCESSING'
    | 'REJECTED'
    | 'SHORTLISTED'
    | 'APPROVED'
    | 'DEPRECATED';
  qc_scores: Record<string, number> | null;
  qc_flags: { severity: string; note: string }[] | null;
  image_url: string | null;
  is_favorite: boolean;
  selected: boolean;
  cost: number;
  created_at: string;
}

export interface GenerationJobProd {
  id: string;
  job_code: string;
  shot_id: string | null;
  project_id: string;
  type: string;
  model: string;
  provider: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  cost: number;
  queued_at: string;
  completed_at: string | null;
}

export interface QcReview {
  id: string;
  take_id: string | null;
  shot_id: string | null;
  project_id: string;
  scores: Record<string, number> | null;
  flags: { severity: string; note: string }[] | null;
  overall: string;
  created_at: string;
}

export const SCENE_STATUS_STYLE: Record<EntityStatus, string> = {
  DRAFT: 'border-[#303a4b] text-[#8b95a7] bg-[#1b2130]',
  REVIEW: 'border-[#f0bb62]/30 text-[#f0bb62] bg-[#f0bb62]/10',
  APPROVED: 'border-[#55d79b]/30 text-[#55d79b] bg-[#55d79b]/10',
  LOCKED: 'border-[#8a78ff]/30 text-[#a99dff] bg-[#8a78ff]/10',
};

export const TAKE_STATUS_STYLE: Record<Take['status'], string> = {
  QUEUED: 'border-[#303a4b] text-[#8b95a7] bg-[#1b2130]',
  GENERATING: 'border-[#8a78ff]/30 text-[#a99dff] bg-[#8a78ff]/10',
  COMPLETED: 'border-[#62a0ff]/30 text-[#62a0ff] bg-[#62a0ff]/10',
  FAILED: 'border-[#ff6d75]/30 text-[#ff6d75] bg-[#ff6d75]/10',
  QC_PROCESSING: 'border-[#f0bb62]/30 text-[#f0bb62] bg-[#f0bb62]/10',
  REJECTED: 'border-[#ff6d75]/30 text-[#ff6d75] bg-[#ff6d75]/10',
  SHORTLISTED: 'border-[#5e9dff]/30 text-[#5e9dff] bg-[#5e9dff]/10',
  APPROVED: 'border-[#55d79b]/30 text-[#55d79b] bg-[#55d79b]/10',
  DEPRECATED: 'border-[#303a4b] text-[#4a5568] bg-[#0f131a]',
};

export const GEN_STATUS_STYLE: Record<GenerationJobProd['status'], { dot: string; text: string }> = {
  QUEUED: { dot: 'bg-[#8b95a7]', text: 'text-[#8b95a7]' },
  PROCESSING: { dot: 'bg-[#8a78ff] status-blink', text: 'text-[#a99dff]' },
  COMPLETED: { dot: 'bg-[#55d79b]', text: 'text-[#55d79b]' },
  FAILED: { dot: 'bg-[#ff6d75]', text: 'text-[#ff6d75]' },
  CANCELLED: { dot: 'bg-[#4a5568]', text: 'text-[#4a5568]' },
};

export const SHOT_SIZES = ['EXTREME WIDE', 'WIDE', 'MEDIUM', 'MEDIUM CLOSE', 'CLOSE-UP', 'EXTREME CLOSE-UP'];
export const CAMERA_ANGLES = ['EYE LEVEL', 'LOW ANGLE', 'HIGH ANGLE', 'OVER-THE-SHOULDER', 'TOP-DOWN', 'DUTCH'];
export const LENSES = ['14MM', '24MM', '35MM', '50MM', '85MM', '135MM'];
export const CAMERA_MOVES = ['STATIC', 'PAN', 'TILT', 'DOLLY IN', 'DOLLY OUT', 'HANDHELD', 'CRANE', 'TRACKING'];
export const LIGHTINGS = ['NATURAL', 'SOFT KEY', 'DRAMATIC', 'BACKLIT', 'PRACTICALS', 'GOLDEN HOUR', 'OVERCAST'];

export function compileProviderPrompts(master: string, model: string): Record<string, string> {
  return {
    veo: `[VEO · ${model}] ${master} Consistent character identity, cinematic lighting, 24fps.`,
    kling: `[KLING · ${model}] ${master} High motion coherence, stable faces.`,
    runway: `[RUNWAY · ${model}] ${master} Camera: per shot config. Preserve palette.`,
    image: `[IMAGE · ${model}] ${master} Single keyframe, composition-first.`,
  };
}
