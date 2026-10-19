import { useState } from 'react';
import { Palette, Check, Lock, Camera } from 'lucide-react';
import type { Project } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export interface StyleCandidate {
  id: string;
  project_id: string;
  name: string;
  tagline: string | null;
  rendering: string | null;
  realism: number;
  lighting: string | null;
  palette: string | null;
  texture: string | null;
  camera: string | null;
  motion: string | null;
  composition: string | null;
  reference_note: string | null;
  status: 'CANDIDATE' | 'LOCKED';
}

export interface CinePreset {
  id: string;
  project_id: string;
  name: string;
  lens: string | null;
  shot_scale: string | null;
  camera_height: string | null;
  movement: string | null;
  lighting: string | null;
  depth: string | null;
  duration: string | null;
  use_case: string | null;
}

const PALETTE_SWATCH: Record<string, string[]> = {
  'Warm amber + cream': ['#f0bb62', '#e8d5b5', '#7a5c2e'],
  'Soft pastel daylight': ['#a8c8ec', '#f5e6d3', '#8fae8b'],
  'High-key bright': ['#ffffff', '#f0f4fa', '#c9d6e8'],
  'Golden hour + teal shadow': ['#f0a35e', '#5e9dff', '#1e3a4f'],
  'Neutral soft': ['#d8dde6', '#8b95a7', '#4a5568'],
};

function paletteFor(p: string | null): string[] {
  if (!p) return ['#303a4b', '#4a5568', '#8b95a7'];
  for (const key of Object.keys(PALETTE_SWATCH)) {
    if (p.toLowerCase().includes(key.toLowerCase().split(' ')[0])) return PALETTE_SWATCH[key];
  }
  return ['#f0bb62', '#62a0ff', '#55d79b'];
}

export function VisualStyleLab({
  candidates, project, onChanged,
}: {
  candidates: StyleCandidate[];
  project: Project;
  onChanged: () => void;
}) {
  const [selId, setSelId] = useState<string | null>(candidates[0]?.id ?? null);
  const sel = candidates.find((c) => c.id === selId) ?? null;

  const lock = async (c: StyleCandidate) => {
    for (const other of candidates) {
      if (other.id !== c.id && other.status === 'LOCKED') {
        await supabaseUnlock(other.id);
      }
    }
    await supabaseLock(c.id);
    onChanged();
  };

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[1fr_320px]">
      <div className="min-h-0 overflow-y-auto pr-1">
        <div className="cineos-card mb-4 p-4">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">Reference board</p>
          <p className="text-[13px] leading-relaxed text-gray-300">
            {project.references_note ?? 'Chưa có reference — bổ sung ở Settings.'}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {candidates.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelId(c.id)}
              className={`cineos-card p-4 text-left transition-all hover:border-[#8a78ff]/40 ${
                c.id === selId ? 'ring-1 ring-[#8a78ff]/40' : ''
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-[#a99dff]">{c.name}</span>
                {c.status === 'LOCKED' ? (
                  <span className="flex items-center gap-1 rounded-full border border-[#8a78ff]/30 bg-[#8a78ff]/10 px-2 py-0.5 text-[9.5px] font-bold text-[#a99dff]">
                    <Lock size={9} /> LOCKED
                  </span>
                ) : (
                  <span className="rounded-full border border-[#303a4b] bg-[#1b2130] px-2 py-0.5 text-[9.5px] font-bold text-[#8b95a7]">CANDIDATE</span>
                )}
              </div>
              <p className="mb-3 text-[13.5px] font-bold leading-snug text-white">{c.tagline}</p>
              <div className="flex gap-1.5">
                {paletteFor(c.palette).map((hex) => (
                  <span key={hex} className="h-6 w-6 rounded-md border border-white/10" style={{ backgroundColor: hex }} />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Attribute side panel */}
      <div className="cineos-panel min-h-0 overflow-y-auto p-4">
        {sel ? (
          <>
            <div className="mb-4 flex items-center gap-2">
              <Palette size={14} className="text-[#a99dff]" />
              <h3 className="text-[14px] font-extrabold text-white">{sel.name}</h3>
            </div>
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-[#8b95a7]">Realism</span>
                <span className="font-mono font-bold text-[#a99dff]">{sel.realism}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#090c11]">
                <div className="ai-accent h-full rounded-full" style={{ width: `${sel.realism}%` }} />
              </div>
            </div>
            <div className="space-y-2.5">
              {([
                ['Rendering', sel.rendering],
                ['Lighting', sel.lighting],
                ['Palette', sel.palette],
                ['Texture', sel.texture],
                ['Camera', sel.camera],
                ['Motion', sel.motion],
                ['Composition', sel.composition],
              ] as const).map(([k, v]) => (
                <div key={k} className="cineos-card p-3">
                  <p className="mb-0.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#a99dff]">{k}</p>
                  <p className="text-[12.5px] leading-relaxed text-gray-300">{v || '—'}</p>
                </div>
              ))}
            </div>
            {sel.status === 'LOCKED' ? (
              <div className="cineos-btn-primary mt-4 w-full cursor-default !py-2.5 text-center text-[12.5px] opacity-80">
                <Lock size={13} className="mr-1.5 inline" /> Project style đã khóa
              </div>
            ) : (
              <button onClick={() => lock(sel)} className="cineos-btn-primary mt-4 w-full !py-2.5 text-[12.5px]">
                <Check size={13} className="mr-1.5 inline" /> LOCK PROJECT STYLE
              </button>
            )}
          </>
        ) : (
          <p className="text-[12.5px] text-[#8b95a7]">Chọn một style candidate.</p>
        )}
      </div>
    </div>
  );
}

async function supabaseLock(id: string) {
  await supabase.from('style_candidates').update({ status: 'LOCKED' }).eq('id', id);
}
async function supabaseUnlock(id: string) {
  await supabase.from('style_candidates').update({ status: 'CANDIDATE' }).eq('id', id);
}

export function CinematographyBible({ presets }: { presets: CinePreset[] }) {
  const [selId, setSelId] = useState<string | null>(presets[0]?.id ?? null);
  const sel = presets.find((p) => p.id === selId) ?? null;

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[260px_1fr]">
      <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelId(p.id)}
            className={`cineos-card w-full p-3.5 text-left transition-all hover:border-[#8a78ff]/40 ${
              p.id === selId ? 'ring-1 ring-[#8a78ff]/40' : ''
            }`}
          >
            <p className="flex items-center gap-2 text-[13.5px] font-extrabold text-white">
              <Camera size={13} className="text-[#a99dff]" /> {p.name}
            </p>
            <p className="mt-0.5 text-[11.5px] text-[#8b95a7]">{p.use_case}</p>
          </button>
        ))}
      </div>
      <div className="cineos-panel min-h-0 overflow-y-auto p-5">
        {sel ? (
          <>
            <h3 className="mb-1 text-lg font-extrabold text-white">{sel.name}</h3>
            <p className="mb-4 text-[13px] text-[#8b95a7]">{sel.use_case}</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {([
                ['Lens', sel.lens],
                ['Shot scale', sel.shot_scale],
                ['Camera height', sel.camera_height],
                ['Movement', sel.movement],
                ['Lighting', sel.lighting],
                ['Depth', sel.depth],
                ['Duration', sel.duration],
              ] as const).map(([k, v]) => (
                <div key={k} className="cineos-card p-3.5">
                  <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#a99dff]">{k}</p>
                  <p className="text-[13px] leading-relaxed text-gray-200">{v || '—'}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[12.5px] text-[#8b95a7]">Chọn một preset.</p>
        )}
      </div>
    </div>
  );
}

/* =================================== TIMELINE ================================== */

const STORY_AGES = ['Birth', 'Baby', 'Toddler', 'School', 'Present', 'Future'];

export function Timeline({ episodes, shots }: { episodes: { id: string; number: number; title: string; script_progress: number; production_progress: number }[]; shots: { id: string; shot_code: string; duration_s: number }[] }) {
  const [mode, setMode] = useState<'STORY' | 'PRODUCTION'>('PRODUCTION');
  const totalDur = shots.reduce((s, x) => s + x.duration_s, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {(['PRODUCTION', 'STORY'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] font-bold transition-colors ${
              mode === m
                ? 'border-[#8a78ff]/50 bg-[#8a78ff]/15 text-[#a99dff]'
                : 'border-[#242c3a] bg-[#151a23] text-[#8b95a7] hover:text-white'
            }`}
          >
            {m === 'PRODUCTION' ? 'PRODUCTION TIMELINE' : 'STORY TIMELINE'}
          </button>
        ))}
      </div>

      {mode === 'PRODUCTION' ? (
        <div className="cineos-panel space-y-4 p-5">
          {episodes.length === 0 && <p className="text-[12.5px] text-[#8b95a7]">Chưa có tập nào.</p>}
          {episodes.map((e) => (
            <div key={e.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[12.5px] font-bold text-white">EP{String(e.number).padStart(2, '0')} — {e.title}</p>
                <span className="font-mono text-[10.5px] text-[#8b95a7]">script {e.script_progress}% · prod {e.production_progress}%</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-[#090c11]">
                <div className="ai-accent h-full opacity-40" style={{ width: `${e.script_progress}%` }} />
                <div
                  className="ai-accent absolute left-0 top-0 h-full opacity-100"
                  style={{ width: `${e.production_progress}%`, clipPath: 'inset(40% 0 40% 0)' }}
                />
              </div>
            </div>
          ))}
          {shots.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">
                Shot duration map — total {totalDur}s
              </p>
              <div className="flex h-8 gap-0.5 overflow-hidden rounded-lg">
                {shots.map((s) => (
                  <div
                    key={s.id}
                    title={`${s.shot_code} · ${s.duration_s}s`}
                    className="flex items-center justify-center border-r border-[#090c11] bg-[#8a78ff]/25 font-mono text-[8.5px] text-[#a99dff] last:border-0"
                    style={{ flexGrow: s.duration_s }}
                  >
                    {s.shot_code}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="cineos-panel p-5">
          <div className="relative flex flex-col items-stretch gap-0">
            {STORY_AGES.map((age, i) => (
              <div key={age} className="relative flex items-center gap-3 pb-5 last:pb-0">
                {i < STORY_AGES.length - 1 && (
                  <span className="absolute left-[7px] top-4 h-full w-px bg-gradient-to-b from-[#8a78ff]/50 to-[#5e9dff]/20" />
                )}
                <span
                  className={`z-10 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                    i < STORY_AGES.length - 1 ? 'border-[#8a78ff] bg-[#8a78ff]/60' : 'border-[#5e9dff] bg-[#5e9dff] shadow-[0_0_10px_rgba(94,157,255,0.6)]'
                  }`}
                />
                <div className="min-w-0">
                  <p className={`text-[13px] font-bold ${i === STORY_AGES.length - 1 ? 'ai-text' : 'text-white'}`}>{age}</p>
                  <p className="text-[11.5px] leading-relaxed text-[#8b95a7]">
                    {i === STORY_AGES.length - 1
                      ? 'Trục câu chuyện chính — nơi các tập diễn ra.'
                      : 'Giai đoạn backstory — dùng cho flashback và Montage opening.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
