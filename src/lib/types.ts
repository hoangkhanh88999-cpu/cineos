export type ProjectStatus =
  | 'IDEA'
  | 'DEVELOPMENT'
  | 'GREENLIGHT'
  | 'SCRIPT_DEVELOPMENT'
  | 'SCRIPT_LOCK'
  | 'PRE_PRODUCTION'
  | 'VISUAL_LOCK'
  | 'PRODUCTION'
  | 'POST_PRODUCTION'
  | 'FINAL_QC'
  | 'MASTER_LOCK'
  | 'MARKETING'
  | 'RELEASED'
  | 'ARCHIVED';

export const PIPELINE: { key: ProjectStatus; label: string }[] = [
  { key: 'IDEA', label: 'Idea' },
  { key: 'DEVELOPMENT', label: 'Development' },
  { key: 'GREENLIGHT', label: 'Greenlight' },
  { key: 'SCRIPT_DEVELOPMENT', label: 'Script Dev' },
  { key: 'SCRIPT_LOCK', label: 'Script Lock' },
  { key: 'PRE_PRODUCTION', label: 'Pre-Production' },
  { key: 'VISUAL_LOCK', label: 'Visual Lock' },
  { key: 'PRODUCTION', label: 'Production' },
  { key: 'POST_PRODUCTION', label: 'Post-Production' },
  { key: 'FINAL_QC', label: 'Final QC' },
  { key: 'MASTER_LOCK', label: 'Master Lock' },
  { key: 'MARKETING', label: 'Marketing' },
  { key: 'RELEASED', label: 'Released' },
];

export const STATUS_TONE: Record<ProjectStatus, 'neutral' | 'info' | 'active' | 'warn' | 'success'> = {
  IDEA: 'neutral',
  DEVELOPMENT: 'info',
  GREENLIGHT: 'info',
  SCRIPT_DEVELOPMENT: 'active',
  SCRIPT_LOCK: 'active',
  PRE_PRODUCTION: 'active',
  VISUAL_LOCK: 'active',
  PRODUCTION: 'warn',
  POST_PRODUCTION: 'warn',
  FINAL_QC: 'warn',
  MASTER_LOCK: 'success',
  MARKETING: 'success',
  RELEASED: 'success',
  ARCHIVED: 'neutral',
};

export interface Project {
  id: string;
  name: string;
  idea: string | null;
  format: string | null;
  genre: string | null;
  tone: string | null;
  audience: string | null;
  distribution: string | null;
  references_note: string | null;
  constraints_note: string | null;
  budget_note: string | null;
  logline: string | null;
  status: ProjectStatus;
  progress: number;
  brief: Brief | null;
  created_at: string;
  updated_at: string;
}

export interface Brief {
  premise?: string;
  coreConflict?: string;
  emotionalPromise?: string;
  uniqueValue?: string;
  rules?: string[];
}

export interface Episode {
  id: string;
  project_id: string;
  number: number;
  title: string;
  logline: string | null;
  status: string;
  theme: string | null;
  character_focus: string | null;
  script_progress: number;
  production_progress: number;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string | null;
  title: string;
  department: string | null;
  agent: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TODO' | 'DOING' | 'BLOCKED' | 'DONE';
  created_at: string;
}

export interface Activity {
  id: string;
  project_id: string | null;
  kind: string;
  message: string;
  created_at: string;
}

export interface NovaMessage {
  id: string;
  project_id: string | null;
  role: 'user' | 'nova';
  content: string;
  created_at: string;
}

export type AgentState = 'IDLE' | 'THINKING' | 'WORKING' | 'DELEGATING' | 'REVIEWING' | 'WAITING' | 'BLOCKED' | 'ERROR' | 'COMPLETED';

export const AGENT_STATE_STYLE: Record<AgentState, { label: string; dot: string; text: string }> = {
  IDLE: { label: 'Idle', dot: 'bg-[#8b95a7]', text: 'text-[#8b95a7]' },
  THINKING: { label: 'Thinking', dot: 'bg-[#8a78ff] status-blink', text: 'text-[#a99dff]' },
  WORKING: { label: 'Working', dot: 'bg-[#62a0ff] status-blink', text: 'text-[#62a0ff]' },
  DELEGATING: { label: 'Delegating', dot: 'bg-[#8a78ff]', text: 'text-[#a99dff]' },
  REVIEWING: { label: 'Reviewing', dot: 'bg-[#f0bb62]', text: 'text-[#f0bb62]' },
  WAITING: { label: 'Waiting', dot: 'bg-[#5e7a9d]', text: 'text-[#5e7a9d]' },
  BLOCKED: { label: 'Blocked', dot: 'bg-[#ff6d75]', text: 'text-[#ff6d75]' },
  ERROR: { label: 'Error', dot: 'bg-[#ff6d75] status-blink', text: 'text-[#ff6d75]' },
  COMPLETED: { label: 'Completed', dot: 'bg-[#55d79b]', text: 'text-[#55d79b]' },
};

export interface Agent {
  id: string;
  name: string;
  role: string;
  department: string | null;
  accent: string;
  state: AgentState;
  context_note: string | null;
}

export type EntityStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'LOCKED';

export const ENTITY_STATUS_STYLE: Record<EntityStatus, string> = {
  DRAFT: 'border-[#303a4b] text-[#8b95a7] bg-[#1b2130]',
  REVIEW: 'border-[#f0bb62]/30 text-[#f0bb62] bg-[#f0bb62]/10',
  APPROVED: 'border-[#55d79b]/30 text-[#55d79b] bg-[#55d79b]/10',
  LOCKED: 'border-[#8a78ff]/30 text-[#a99dff] bg-[#8a78ff]/10',
};

export interface Character {
  id: string;
  project_id: string;
  code: string;
  name: string;
  role: string | null;
  archetype: string | null;
  personality: string | null;
  appearance: Record<string, string> | null;
  voice: Record<string, string> | null;
  story: Record<string, string> | null;
  status: EntityStatus;
  version: number;
}

export interface CharacterRelationship {
  id: string;
  project_id: string;
  from_character: string;
  to_character: string;
  type: string;
  strength: number;
  conflict: string | null;
  history: string | null;
}

export interface LocationNode {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  palette: string | null;
  lighting: string | null;
}

export interface Prop {
  id: string;
  project_id: string;
  code: string;
  name: string;
  owner_character: string | null;
  location: string | null;
  condition: string;
  notes: string | null;
}

export interface Approval {
  id: string;
  project_id: string;
  title: string;
  kind: string;
  payload: Record<string, unknown> | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  created_at: string;
}

export interface GenerationJob {
  id: string;
  project_id: string;
  code: string;
  type: string;
  model: string | null;
  status: 'QUEUED' | 'RUNNING' | 'QC' | 'COMPLETED' | 'FAILED';
  progress: number | null;
  cost: number;
  created_at: string;
}

export interface CostEvent {
  id: string;
  project_id: string;
  category: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface WizardData {
  idea: string;
  format: string;
  genre: string;
  tone: string;
  visual: string;
  audience: string;
  distribution: string;
  references_note: string;
  constraints_note: string;
  budget_note: string;
  title: string;
  logline: string;
  premise: string;
  coreConflict: string;
  emotionalPromise: string;
  uniqueValue: string;
}

export const emptyWizard: WizardData = {
  idea: '',
  format: 'Animated Series',
  genre: '',
  tone: 'Warm',
  visual: '',
  audience: '',
  distribution: '',
  references_note: '',
  constraints_note: '',
  budget_note: '',
  title: '',
  logline: '',
  premise: '',
  coreConflict: '',
  emotionalPromise: '',
  uniqueValue: '',
};

export const FORMATS = [
  'Animated Series',
  'Live-action Series',
  'Feature Film',
  'Short Film',
  'Vertical Series',
  'Documentary',
  'Music Video',
  'Commercial',
  'Experimental',
];

export const TONES = [
  'Warm',
  'Playful comedy',
  'Heartfelt drama',
  'Cinematic epic',
  'Dark & moody',
  'Whimsical',
  'Documentary realism',
];

export const AUDIENCES = [
  'Parents with young kids',
  'Family (all ages)',
  'Teens & young adults',
  'Adults',
  'Kids 6-12',
];

export const DISTRIBUTIONS = [
  'YouTube',
  'TikTok / Reels',
  'Netflix-style SVOD',
  'Film festival',
  'Brand campaign',
  'Internal / pitch',
];

export function buildBrief(w: WizardData): Brief {
  return {
    premise: w.premise,
    coreConflict: w.coreConflict,
    emotionalPromise: w.emotionalPromise,
    uniqueValue: w.uniqueValue,
    rules: [
      'Mỗi tập chỉ tập trung một thông điệp',
      'Không xây dựng thành viên gia đình như phản diện',
    ],
  };
}

export function deriveBriefFromIdea(idea: string): Partial<WizardData> {
  const first = idea.trim().split(/[.!?\n]/)[0]?.trim() ?? '';
  return {
    title: first.length > 60 ? first.slice(0, 60).trim() + '…' : first || 'Untitled Project',
    logline: idea.trim().split('\n')[0]?.slice(0, 220) || '',
    premise: idea.trim(),
  };
}
