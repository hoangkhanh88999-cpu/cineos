import { useMemo, useState } from 'react';
import {
  Clapperboard, Plus, Film, Wand2, Sparkles, Star, CheckCircle2,
  Flag, AlertTriangle, Layers, Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Character, Episode, LocationNode, Prop, Project } from '@/lib/types';
import { PIPELINE } from '@/lib/types';
import { ProgressBar, EmptyState } from '@/components/ui';
import {
  SCENE_STATUS_STYLE, TAKE_STATUS_STYLE, GEN_STATUS_STYLE,
  SHOT_SIZES, CAMERA_ANGLES, LENSES, CAMERA_MOVES, LIGHTINGS,
  compileProviderPrompts,
} from '@/lib/production';
import type { Scene, StoryboardFrame, Shot, Take, GenerationJobProd } from '@/lib/production';

/* ============================== SCREENPLAY EDITOR ============================== */

export function ScreenplayEditor({
  scenes, episodeTitle,
}: {
  scenes: Scene[];
  episodeTitle: string | null;
}) {
  const [selId, setSelId] = useState<string | null>(scenes[0]?.id ?? null);
  const sel = scenes.find((s) => s.id === selId) ?? null;

  const insights = useMemo(() => {
    if (!sel) return [];
    const out: { label: string; tone: string; text: string }[] = [];
    out.push({
      label: 'Continuity',
      tone: 'text-[#62a0ff]',
      text: sel.continuity_in
        ? `Vào cảnh: ${sel.continuity_in}${sel.continuity_out ? ` — ra cảnh: ${sel.continuity_out}` : ''}`
        : 'Chưa khai báo continuity in/out.',
    });
    out.push({
      label: 'Character',
      tone: 'text-[#a99dff]',
      text: sel.objective
        ? `Objective rõ ràng: ${sel.objective}`
        : 'Scene chưa có story objective — INK khuyến nghị bổ sung.',
    });
    out.push({
      label: 'Production',
      tone: 'text-[#f0bb62]',
      text: `${sel.characters.length} characters · ${sel.props.length} props · ${sel.time ?? 'DAY'}. Complexity ${sel.characters.length > 2 ? 'CAO' : 'THẤP'}.`,
    });
    out.push({
      label: 'Suggestions',
      tone: 'text-[#55d79b]',
      text: sel.dialogue && sel.dialogue.length > 0
        ? `${sel.dialogue.length} câu thoại — cân nhắc comedy beat ở giữa cảnh.`
        : 'Cảnh chưa có dialogue — có thể là cảnh hành động thuần.',
    });
    return out;
  }, [sel]);

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[180px_1fr_260px]">
      {/* Scene navigator */}
      <div className="cineos-panel min-h-0 overflow-y-auto p-2">
        {scenes.length === 0 ? (
          <p className="p-3 text-[12px] text-[#8b95a7]">Chưa có scene nào.</p>
        ) : (
          scenes.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelId(s.id)}
              className={`mb-1 w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                s.id === selId ? 'bg-[#8a78ff]/15 text-[#a99dff]' : 'text-[#8b95a7] hover:bg-[#1b2130] hover:text-white'
              }`}
            >
              <p className="font-mono text-[10px] font-bold">SC{String(s.scene_number).padStart(2, '0')}</p>
              <p className="truncate text-[12px] font-medium">{s.slug}</p>
            </button>
          ))
        )}
      </div>

      {/* Screenplay */}
      <div className="cineos-panel min-h-0 overflow-y-auto p-6">
        {sel ? (
          <>
            <div className="mb-4 flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-[#a99dff]">
                SC{String(sel.scene_number).padStart(2, '0')} · {episodeTitle ?? 'UNASSIGNED'}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${SCENE_STATUS_STYLE[sel.status]}`}>
                {sel.status}
              </span>
            </div>
            {sel.screenplay ? (
              <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-gray-200">{sel.screenplay}</pre>
            ) : (
              <div className="space-y-4 font-mono text-[13px] leading-relaxed text-gray-300">
                <p className="font-bold uppercase">{sel.slug} — {sel.time}</p>
                {sel.action && <p>{sel.action}</p>}
                {(sel.dialogue ?? []).map((d, i) => (
                  <div key={i}>
                    <p className="font-bold text-gray-100">{d.character}</p>
                    <p className="pl-6">{d.line}</p>
                  </div>
                ))}
                {!sel.action && (sel.dialogue ?? []).length === 0 && (
                  <p className="text-[#4a5568]">— Screenplay chưa được viết. INK sẽ draft ở bước Draft Screenplay. —</p>
                )}
              </div>
            )}
          </>
        ) : (
          <EmptyState icon={Film} title="Chọn một scene" />
        )}
      </div>

      {/* AI insights */}
      <div className="cineos-panel min-h-0 overflow-y-auto p-4">
        <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a99dff]">AI Insights</p>
        <div className="space-y-2.5">
          {insights.map((i) => (
            <div key={i.label} className="cineos-card p-3">
              <p className={`mb-1 text-[11px] font-bold ${i.tone}`}>{i.label}</p>
              <p className="text-[12.5px] leading-relaxed text-[#8b95a7]">{i.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================ SCENE BUILDER ================================ */

export function SceneBuilder({
  scenes, episodes, characters, locations, props, onChanged,
}: {
  scenes: Scene[];
  episodes: Episode[];
  characters: Character[];
  locations: LocationNode[];
  props: Prop[];
  onChanged: () => void;
}) {
  const [selId, setSelId] = useState<string | null>(scenes[0]?.id ?? null);
  const sel = scenes.find((s) => s.id === selId) ?? null;
  const [busy, setBusy] = useState(false);

  const charName = (id: string) => characters.find((c) => c.id === id)?.name ?? '—';
  const propName = (id: string) => props.find((p) => p.id === id)?.name ?? '—';
  const locName = (id: string | null) => locations.find((l) => l.id === id)?.name ?? null;

  const addScene = async () => {
    setBusy(true);
    const maxN = scenes.reduce((m, s) => Math.max(m, s.scene_number), 0);
    await supabase.from('scenes').insert({
      project_id: scenes[0]?.project_id,
      episode_id: episodes[0]?.id ?? null,
      scene_number: maxN + 1,
      slug: `INT. NEW SCENE`,
    });
    setBusy(false);
    onChanged();
  };

  const saveField = async (field: string, value: string) => {
    if (!sel) return;
    await supabase.from('scenes').update({ [field]: value }).eq('id', sel.id);
    onChanged();
  };

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[300px_1fr]">
      <div className="min-h-0 overflow-y-auto pr-1">
        <button onClick={addScene} disabled={busy} className="cineos-btn-ghost mb-3 w-full !py-2 text-[12.5px]">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Thêm scene
        </button>
        <div className="space-y-2">
          {scenes.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelId(s.id)}
              className={`cineos-card w-full p-3 text-left transition-all hover:border-[#8a78ff]/40 ${
                s.id === selId ? 'ring-1 ring-[#8a78ff]/40' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-[#a99dff]">SC{String(s.scene_number).padStart(2, '0')}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold ${SCENE_STATUS_STYLE[s.status]}`}>{s.status}</span>
              </div>
              <p className="mt-1 truncate text-[13px] font-bold text-white">{s.slug}</p>
              <p className="text-[11px] text-[#8b95a7]">{s.time} · {episodes.find((e) => e.id === s.episode_id)?.title ?? '—'}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="cineos-panel min-h-0 overflow-y-auto p-5">
        {sel ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#a99dff]">SCENE {String(sel.scene_number).padStart(2, '0')}</span>
              <select
                value={sel.status}
                onChange={(e) => saveField('status', e.target.value)}
                className="cineos-input !w-auto !py-1 text-[11px] font-bold"
              >
                {(['DRAFT', 'REVIEW', 'APPROVED', 'LOCKED'] as const).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Slug">
                <input
                  className="cineos-input"
                  defaultValue={sel.slug}
                  onBlur={(e) => e.target.value !== sel.slug && saveField('slug', e.target.value)}
                />
              </Field>
              <Field label="Time">
                <select className="cineos-input" value={sel.time ?? 'DAY'} onChange={(e) => saveField('time', e.target.value)}>
                  {['DAY', 'NIGHT', 'DAWN', 'DUSK', 'MORNING', 'CONTINUOUS'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Location">
                <select className="cineos-input" value={sel.location_id ?? ''} onChange={(e) => saveField('location_id', e.target.value)}>
                  <option value="">—</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </Field>
              <Field label="Characters">
                <p className="text-[13px] text-gray-300">{sel.characters.map(charName).join(', ') || '—'}</p>
              </Field>
              <Field label="Props">
                <p className="text-[13px] text-gray-300">{sel.props.map(propName).join(', ') || '—'}</p>
              </Field>
              <Field label="Costumes">
                <input
                  className="cineos-input"
                  defaultValue={sel.costumes ?? ''}
                  onBlur={(e) => e.target.value !== (sel.costumes ?? '') && saveField('costumes', e.target.value)}
                />
              </Field>
              <Field label="Story objective">
                <input
                  className="cineos-input"
                  defaultValue={sel.objective ?? ''}
                  onBlur={(e) => e.target.value !== (sel.objective ?? '') && saveField('objective', e.target.value)}
                />
              </Field>
              <Field label="Conflict">
                <input
                  className="cineos-input"
                  defaultValue={sel.conflict ?? ''}
                  onBlur={(e) => e.target.value !== (sel.conflict ?? '') && saveField('conflict', e.target.value)}
                />
              </Field>
              <Field label="Emotion arc">
                <input
                  className="cineos-input"
                  defaultValue={sel.emotion_arc ?? ''}
                  onBlur={(e) => e.target.value !== (sel.emotion_arc ?? '') && saveField('emotion_arc', e.target.value)}
                />
              </Field>
              <Field label="Continuity in → out">
                <p className="text-[12.5px] text-gray-300">{sel.continuity_in || '—'} → {sel.continuity_out || '—'}</p>
              </Field>
            </div>
            {locName(sel.location_id) && (
              <div className="cineos-card mt-4 p-3">
                <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">Environment note</p>
                <p className="text-[12.5px] text-[#8b95a7]">
                  {locations.find((l) => l.id === sel.location_id)?.description}
                </p>
              </div>
            )}
          </>
        ) : (
          <EmptyState icon={Clapperboard} title="Chọn hoặc thêm một scene" hint="Scene là đơn vị nền tảng của kịch bản, storyboard và shot." />
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="cineos-label mb-1 block font-mono text-[9.5px] uppercase tracking-[0.16em]">{label}</span>
      {children}
    </label>
  );
}

/* ================================= STORYBOARD ================================== */

export function Storyboard({
  frames, scenes, onChanged,
}: {
  frames: StoryboardFrame[];
  scenes: Scene[];
  onChanged: () => void;
}) {
  const [sceneId, setSceneId] = useState<string | null>(scenes[0]?.id ?? null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const visible = frames.filter((f) => f.scene_id === sceneId).sort((a, b) => a.frame_number - b.frame_number);

  const generate = async (f: StoryboardFrame) => {
    setBusyId(f.id);
    // simulate AI generation pipeline: PENDING -> GENERATING -> READY
    await supabase.from('storyboard_frames').update({ status: 'GENERATING' }).eq('id', f.id);
    onChanged();
    setTimeout(async () => {
      await supabase.from('storyboard_frames').update({ status: 'READY', image_url: null }).eq('id', f.id);
      setBusyId(null);
      onChanged();
    }, 1200);
  };

  const approve = async (f: StoryboardFrame) => {
    await supabase.from('storyboard_frames').update({ status: 'APPROVED' }).eq('id', f.id);
    onChanged();
  };

  const move = async (f: StoryboardFrame, dir: -1 | 1) => {
    const idx = visible.findIndex((x) => x.id === f.id);
    const other = visible[idx + dir];
    if (!other) return;
    await supabase.from('storyboard_frames').update({ frame_number: other.frame_number }).eq('id', f.id);
    await supabase.from('storyboard_frames').update({ frame_number: f.frame_number }).eq('id', other.id);
    onChanged();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b95a7]">Scene</span>
        <select className="cineos-input !w-auto !py-1.5 text-[12px]" value={sceneId ?? ''} onChange={(e) => setSceneId(e.target.value)}>
          <option value="">— tất cả —</option>
          {scenes.map((s) => (
            <option key={s.id} value={s.id}>SC{String(s.scene_number).padStart(2, '0')} {s.slug}</option>
          ))}
        </select>
      </div>
      {visible.length === 0 ? (
        <EmptyState icon={Film} title="Chưa có frame nào cho scene này" hint="AI sẽ tự sinh frame từ scene outline ở bước Storyboard." />
      ) : (
        <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((f, i) => (
            <div key={f.id} className="cineos-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold text-[#a99dff]">Shot {String(f.frame_number).padStart(2, '0')}</span>
                <span className="font-mono text-[10px] text-[#8b95a7]">{f.duration_s}s</span>
              </div>
              <div className="mb-3 flex aspect-video items-center justify-center rounded-lg border border-[#242c3a] bg-[#090c11]">
                {f.status === 'APPROVED' || f.status === 'READY' ? (
                  <div className="p-3 text-center">
                    <p className="text-[11px] font-bold text-[#62a0ff]">{f.shot_suggestion || 'FRAME'}</p>
                    <p className="mt-1 text-[10.5px] text-[#8b95a7]">{f.composition}</p>
                  </div>
                ) : f.status === 'GENERATING' ? (
                  <Loader2 size={20} className="animate-spin text-[#8a78ff]" />
                ) : (
                  <span className="font-mono text-[10px] text-[#4a5568]">NOT GENERATED</span>
                )}
              </div>
              {f.action && <p className="mb-2 line-clamp-2 text-[12px] leading-relaxed text-gray-300">{f.action}</p>}
              {f.annotations.length > 0 && (
                <p className="mb-2 line-clamp-1 text-[11px] italic text-[#f0bb62]">✎ {f.annotations[0]}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {f.status !== 'READY' && f.status !== 'APPROVED' && (
                  <button onClick={() => generate(f)} disabled={busyId === f.id} className="cineos-btn-ghost !px-2 !py-1 text-[10.5px]">
                    {busyId === f.id || f.status === 'GENERATING' ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                    {f.status === 'PENDING' ? 'Generate' : 'Regenerate'}
                  </button>
                )}
                {f.status === 'READY' && (
                  <button onClick={() => approve(f)} className="cineos-btn-ghost !px-2 !py-1 !border-[#55d79b]/40 text-[10.5px] !text-[#55d79b]">
                    <CheckCircle2 size={11} /> Approve
                  </button>
                )}
                {f.status === 'APPROVED' && (
                  <span className="rounded border border-[#55d79b]/30 bg-[#55d79b]/10 px-2 py-1 text-[10px] font-bold text-[#55d79b]">APPROVED</span>
                )}
                <button onClick={() => move(f, -1)} disabled={i === 0} className="cineos-btn-ghost !px-2 !py-1 text-[10.5px] disabled:opacity-30">←</button>
                <button onClick={() => move(f, 1)} disabled={i === visible.length - 1} className="cineos-btn-ghost !px-2 !py-1 text-[10.5px] disabled:opacity-30">→</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================ SHOT DESIGNER ================================ */

export function ShotDesigner({
  shots, scenes, characters, props: propList, prompts, takes, onChanged,
}: {
  shots: Shot[];
  scenes: Scene[];
  characters: Character[];
  props: Prop[];
  prompts: { shot_id: string; master_prompt: string; sections: Record<string, string>; provider_prompts: Record<string, string> }[];
  takes: Take[];
  onChanged: () => void;
}) {
  const [selId, setSelId] = useState<string | null>(shots[0]?.id ?? null);
  const sel = shots.find((s) => s.id === selId) ?? null;
  const [busy, setBusy] = useState(false);

  const save = async (field: string, value: string) => {
    if (!sel) return;
    await supabase.from('shots').update({ [field]: value }).eq('id', sel.id);
    onChanged();
  };

  const generateTake = async () => {
    if (!sel) return;
    setBusy(true);
    const master = prompts.find((p) => p.shot_id === sel.id)?.master_prompt ?? [
      sel.action, sel.shot_size, sel.lens, sel.camera_movement, sel.lighting, sel.dialogue,
    ].filter(Boolean).join(', ');
    const n = takes.filter((t) => t.shot_id === sel.id).length + 1;
    await supabase.from('takes').insert({
      project_id: sel.project_id,
      shot_id: sel.id,
      take_number: n,
      status: 'GENERATING',
    });
    await supabase.from('shots').update({ generation_status: 'GENERATING' }).eq('id', sel.id);
    onChanged();
    setTimeout(async () => {
      const scores = {
        identity: 90 + Math.floor(Math.random() * 10),
        costume: 92 + Math.floor(Math.random() * 8),
        environment: 88 + Math.floor(Math.random() * 12),
        motion: 84 + Math.floor(Math.random() * 12),
        continuity: 90 + Math.floor(Math.random() * 10),
        artifacts: 88 + Math.floor(Math.random() * 10),
      };
      const flags: { severity: string; note: string }[] = [];
      if (scores.motion < 90) flags.push({ severity: 'Medium', note: 'Foot sliding nhẹ ở giây thứ 2' });
      await supabase.from('takes').update({ status: 'QC_PROCESSING', qc_scores: scores, qc_flags: flags, cost: 0.42 }).eq('id', (await supabase.from('takes').select('id').eq('shot_id', sel.id).order('take_number', { ascending: false }).limit(1)).data?.[0]?.id);
      await supabase.from('shots').update({ generation_status: 'QC', qc_status: 'PROCESSING' }).eq('id', sel.id);
      setBusy(false);
      onChanged();
    }, 1500);
  };

  const shotScenes = scenes.filter((s) => shots.some((sh) => sh.scene_id === s.id));

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[1fr_360px]">
      <div className="flex min-h-0 flex-col">
        {/* Shot strip */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {shots.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelId(s.id)}
              className={`rounded-lg border px-2.5 py-1.5 font-mono text-[11px] font-bold transition-colors ${
                s.id === selId
                  ? 'border-[#8a78ff]/50 bg-[#8a78ff]/15 text-[#a99dff]'
                  : 'border-[#242c3a] bg-[#151a23] text-[#8b95a7] hover:text-white'
              }`}
            >
              {s.shot_code}
            </button>
          ))}
          {shots.length === 0 && <p className="text-[12.5px] text-[#8b95a7]">Chưa có shot nào.</p>}
        </div>
        {/* Preview */}
        <div className="cineos-panel mb-3 flex min-h-[180px] flex-1 flex-col items-center justify-center rounded-xl p-6">
          {sel ? (
            <>
              <p className="font-mono text-4xl font-extrabold ai-text">{sel.shot_code}</p>
              <p className="mt-2 text-[13px] text-[#8b95a7]">{sel.action || '—'}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {[sel.shot_size, sel.lens, sel.camera_angle, sel.camera_movement, sel.lighting].map((t) => (
                  <span key={t} className="cineos-chip">{t}</span>
                ))}
              </div>
              <p className="mt-3 font-mono text-[10.5px] text-[#8b95a7]">
                GEN: {sel.generation_status} · QC: {sel.qc_status} · APPROVAL: {sel.approval_status}
              </p>
            </>
          ) : (
            <EmptyState icon={Clapperboard} title="Chọn một shot" />
          )}
        </div>
        {/* Story + Camera + Environment quadrants */}
        {sel && (
          <div className="grid shrink-0 gap-3 sm:grid-cols-2">
            <div className="cineos-card p-3">
              <p className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#a99dff]">Story</p>
              <p className="text-[12.5px] text-gray-300">{characters.find((c) => sel.character_ids.includes(c.id))?.name ?? '—'}</p>
              <p className="text-[12px] text-[#8b95a7]">Perf: {sel.performance || '—'} · Expr: {sel.expression || '—'}</p>
            </div>
            <div className="cineos-card p-3">
              <p className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#a99dff]">Environment</p>
              <p className="text-[12.5px] text-gray-300">{scenes.find((sc) => sc.id === sel.scene_id)?.slug ?? '—'}</p>
              <p className="text-[12px] text-[#8b95a7]">Props: {sel.prop_ids.map((id) => propList.find((p) => p.id === id)?.name).filter(Boolean).join(', ') || '—'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Camera config panel */}
      <div className="cineos-panel min-h-0 overflow-y-auto p-4">
        {sel ? (
          <>
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a99dff]">Camera & Generation</p>
            <div className="space-y-2.5">
              <Field label="Shot size">
                <select className="cineos-input" value={sel.shot_size} onChange={(e) => save('shot_size', e.target.value)}>
                  {SHOT_SIZES.map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Camera angle">
                <select className="cineos-input" value={sel.camera_angle} onChange={(e) => save('camera_angle', e.target.value)}>
                  {CAMERA_ANGLES.map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Lens">
                <select className="cineos-input" value={sel.lens} onChange={(e) => save('lens', e.target.value)}>
                  {LENSES.map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Movement">
                <select className="cineos-input" value={sel.camera_movement} onChange={(e) => save('camera_movement', e.target.value)}>
                  {CAMERA_MOVES.map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Lighting">
                <select className="cineos-input" value={sel.lighting} onChange={(e) => save('lighting', e.target.value)}>
                  {LIGHTINGS.map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Start state → End state">
                <p className="text-[12.5px] text-gray-300">{sel.start_state || '—'} → {sel.end_state || '—'}</p>
              </Field>
              <button onClick={generateTake} disabled={busy} className="cineos-btn-primary w-full !py-2 text-[12.5px]">
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Generate Take
              </button>
            </div>

            {/* Takes */}
            {takes.filter((t) => t.shot_id === sel.id).length > 0 && (
              <>
                <p className="mb-2 mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a99dff]">Takes</p>
                <div className="space-y-2">
                  {takes
                    .filter((t) => t.shot_id === sel.id)
                    .sort((a, b) => a.take_number - b.take_number)
                    .map((t) => (
                      <div key={t.id} className="cineos-card p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11.5px] font-bold text-white">TAKE {String(t.take_number).padStart(2, '0')}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold ${TAKE_STATUS_STYLE[t.status]}`}>{t.status}</span>
                        </div>
                        {t.qc_scores && Object.keys(t.qc_scores).length > 0 && (
                          <div className="mt-2 grid grid-cols-3 gap-1.5">
                            {Object.entries(t.qc_scores).map(([k, v]) => (
                              <div key={k} className="rounded bg-[#090c11] px-1.5 py-1 text-center">
                                <p className={`font-mono text-[11px] font-bold ${v >= 95 ? 'text-[#55d79b]' : v >= 85 ? 'text-[#f0bb62]' : 'text-[#ff6d75]'}`}>{v}</p>
                                <p className="text-[8.5px] uppercase text-[#4a5568]">{k}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {(t.qc_flags ?? []).map((f, i) => (
                          <p key={i} className="mt-1.5 text-[11px] text-[#f0bb62]">⚠ {f.severity}: {f.note}</p>
                        ))}
                      </div>
                    ))}
                </div>
              </>
            )}
          </>
        ) : (
          <EmptyState icon={Clapperboard} title="Chọn shot để cấu hình" />
        )}
      </div>
    </div>
  );
}

/* ================================ PROMPT ENGINE ================================ */

export function PromptEngine({
  shots, prompts, onChanged,
}: {
  shots: Shot[];
  prompts: { shot_id: string; master_prompt: string; sections: Record<string, string>; provider_prompts: Record<string, string> }[];
  onChanged: () => void;
}) {
  const [selId, setSelId] = useState<string | null>(shots[0]?.id ?? null);
  const sel = shots.find((s) => s.id === selId) ?? null;
  const [busy, setBusy] = useState(false);
  const compiled = prompts.find((p) => p.shot_id === selId) ?? null;

  const compile = async () => {
    if (!sel) return;
    setBusy(true);
    const sections: Record<string, string> = {
      character: sel.character_ids.length ? sel.character_ids.join(', ') : 'none',
      action: sel.action || '',
      environment: sel.dialogue ? `${sel.weather}, ${sel.lighting}` : sel.lighting,
      camera: `${sel.shot_size}, ${sel.lens} lens, ${sel.camera_angle}, ${sel.camera_movement}`,
      lighting: sel.lighting,
      style: 'CINEOS project style locked',
      motion: sel.performance || 'natural performance',
    };
    const master = Object.values(sections).filter(Boolean).join('. ');
    await supabase.from('master_prompts').insert({
      project_id: sel.project_id,
      shot_id: sel.id,
      sections,
      master_prompt: master,
      provider_prompts: compileProviderPrompts(master, 'latest'),
    });
    setBusy(false);
    onChanged();
  };

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[240px_1fr]">
      <div className="min-h-0 space-y-1 overflow-y-auto pr-1">
        {shots.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelId(s.id)}
            className={`w-full rounded-lg px-2.5 py-2 text-left font-mono text-[12px] font-bold transition-colors ${
              s.id === selId ? 'bg-[#8a78ff]/15 text-[#a99dff]' : 'text-[#8b95a7] hover:bg-[#1b2130] hover:text-white'
            }`}
          >
            {s.shot_code}
            {prompts.some((p) => p.shot_id === s.id) && <span className="ml-1.5 text-[9px] text-[#55d79b]">● COMPILED</span>}
          </button>
        ))}
      </div>
      <div className="cineos-panel min-h-0 overflow-y-auto p-5">
        {sel ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-mono text-lg font-extrabold ai-text">{sel.shot_code}</h3>
              <button onClick={compile} disabled={busy} className="cineos-btn-primary !py-2 text-[12.5px]">
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Layers size={13} />} Compile Prompt
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {(['character', 'action', 'environment', 'camera', 'lighting', 'style', 'motion'] as const).map((k) => (
                <div key={k} className="cineos-card p-3">
                  <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#a99dff]">+ {k}</p>
                  <p className="text-[12.5px] leading-relaxed text-gray-300">
                    {compiled?.sections?.[k] ?? '— chưa compile —'}
                  </p>
                </div>
              ))}
            </div>
            {compiled && (
              <div className="mt-4 space-y-3">
                <div className="cineos-card border-[#8a78ff]/25 p-4">
                  <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a99dff]">Master Prompt</p>
                  <p className="font-mono text-[12.5px] leading-relaxed text-gray-200">{compiled.master_prompt}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(compiled.provider_prompts ?? {}).map(([k, v]) => (
                    <div key={k} className="cineos-card p-3">
                      <p className="mb-1 font-mono text-[10px] font-bold uppercase text-[#62a0ff]">{k}_PROMPT</p>
                      <p className="text-[11.5px] leading-relaxed text-[#8b95a7]">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState icon={Layers} title="Chọn shot để compile prompt" hint="Prompt được assemble có cấu trúc, không phải text tự do." />
        )}
      </div>
    </div>
  );
}

/* ============================= GENERATION MANAGER ============================== */

export function GenerationManager({
  jobs, takes, shots, onChanged,
}: {
  jobs: GenerationJobProd[];
  takes: Take[];
  shots: Shot[];
  onChanged: () => void;
}) {
  const advance = async (j: GenerationJobProd) => {
    if (j.status === 'QUEUED') {
      await supabase.from('generation_jobs_prod').update({ status: 'PROCESSING', progress: 40 }).eq('id', j.id);
    } else if (j.status === 'PROCESSING') {
      await supabase.from('generation_jobs_prod')
        .update({ status: 'COMPLETED', progress: 100, completed_at: new Date().toISOString() })
        .eq('id', j.id);
      if (j.shot_id) {
        await supabase.from('shots').update({ generation_status: 'COMPLETED', qc_status: 'PENDING' }).eq('id', j.shot_id);
        const open = takes.filter((t) => t.shot_id === j.shot_id && (t.status === 'GENERATING' || t.status === 'QUEUED'));
        for (const t of open) {
          await supabase.from('takes').update({ status: 'QC_PROCESSING' }).eq('id', t.id);
        }
      }
    }
    onChanged();
  };

  const cancel = async (j: GenerationJobProd) => {
    await supabase.from('generation_jobs_prod').update({ status: 'CANCELLED' }).eq('id', j.id);
    onChanged();
  };

  return (
    <div className="cineos-panel overflow-x-auto p-4">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-[#242c3a] font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#4a5568]">
            <th className="pb-2 pr-3">Job</th>
            <th className="pb-2 pr-3">Type</th>
            <th className="pb-2 pr-3">Model</th>
            <th className="pb-2 pr-3">Status</th>
            <th className="pb-2 pr-3">Progress</th>
            <th className="pb-2 pr-3">Cost</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {jobs.length === 0 && (
            <tr><td colSpan={7} className="py-6 text-center text-[12.5px] text-[#8b95a7]">Hàng đợi trống — generate take từ Shot Designer để tạo job.</td></tr>
          )}
          {jobs.map((j) => {
            const st = GEN_STATUS_STYLE[j.status];
            const shotCode = shots.find((s) => s.id === j.shot_id)?.shot_code ?? '—';
            return (
              <tr key={j.id} className="border-b border-[#151a23] text-[12.5px]">
                <td className="py-2.5 pr-3">
                  <p className="font-mono font-bold text-white">{j.job_code}</p>
                  <p className="text-[10.5px] text-[#4a5568]">{shotCode}</p>
                </td>
                <td className="pr-3 text-[#8b95a7]">{j.type}</td>
                <td className="pr-3 text-[#8b95a7]">{j.model}</td>
                <td className="pr-3">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    <span className={st.text}>{j.status}</span>
                  </span>
                </td>
                <td className="pr-3">
                  <div className="w-24"><ProgressBar value={j.progress} className="!h-1" /></div>
                </td>
                <td className="pr-3 font-mono text-[#f0bb62]">${j.cost.toFixed(2)}</td>
                <td>
                  <div className="flex gap-1.5">
                    {(j.status === 'QUEUED' || j.status === 'PROCESSING') && (
                      <>
                        <button onClick={() => advance(j)} className="cineos-btn-ghost !px-2 !py-1 text-[10.5px]">Advance</button>
                        <button onClick={() => cancel(j)} className="cineos-btn-ghost !px-2 !py-1 text-[10.5px] !text-[#ff6d75]">Cancel</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============================== PRODUCTION BOARD =============================== */

const BOARD_COLUMNS: { key: string; label: string }[] = [
  { key: 'NOT_READY', label: 'Not Ready' },
  { key: 'COMPLETED', label: 'Ready' },
  { key: 'GENERATING', label: 'Generating' },
  { key: 'QC', label: 'QC' },
  { key: 'NEEDS_FIX', label: 'Needs Fix' },
  { key: 'SHOT_APPROVED', label: 'Approved' },
];

export function ProductionBoard({ shots, onChanged }: { shots: Shot[]; onChanged: () => void }) {
  const [dragId, setDragId] = useState<string | null>(null);

  const columnOf = (s: Shot): string => {
    if (s.approval_status === 'APPROVED') return 'SHOT_APPROVED';
    if (s.qc_status === 'FAILED') return 'NEEDS_FIX';
    if (s.generation_status === 'QC' || s.qc_status === 'PROCESSING') return 'QC';
    if (s.generation_status === 'GENERATING') return 'GENERATING';
    if (s.generation_status === 'COMPLETED') return 'COMPLETED';
    return 'NOT_READY';
  };

  const drop = async (col: string) => {
    if (!dragId) return;
    const updates: Record<string, Partial<Shot>> = {
      NOT_READY: { generation_status: 'NOT_READY', qc_status: 'PENDING', approval_status: 'DRAFT' },
      COMPLETED: { generation_status: 'COMPLETED' },
      GENERATING: { generation_status: 'GENERATING' },
      QC: { generation_status: 'QC' },
      NEEDS_FIX: { qc_status: 'FAILED' },
      SHOT_APPROVED: { approval_status: 'APPROVED' },
    };
    await supabase.from('shots').update(updates[col]).eq('id', dragId);
    setDragId(null);
    onChanged();
  };

  return (
    <div className="grid min-h-0 flex-1 grid-flow-col auto-cols-[minmax(200px,1fr)] gap-3 overflow-x-auto pb-2">
      {BOARD_COLUMNS.map((c) => {
        const cards = shots.filter((s) => columnOf(s) === c.key);
        return (
          <div
            key={c.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(c.key)}
            className="flex min-h-0 flex-col rounded-xl border border-[#242c3a] bg-[#0f131a]"
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-[#242c3a] px-3 py-2.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b95a7]">{c.label}</p>
              <span className="ml-auto rounded-full bg-[#1b2130] px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-[#8b95a7]">{cards.length}</span>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
              {cards.map((s) => (
                <div
                  key={s.id}
                  draggable
                  onDragStart={() => setDragId(s.id)}
                  className="cineos-card cursor-grab p-3 active:cursor-grabbing"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[11.5px] font-bold text-[#a99dff]">{s.shot_code}</p>
                    <span className="font-mono text-[9.5px] text-[#4a5568]">{s.duration_s}s</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-[#8b95a7]">{s.action || '—'}</p>
                  <p className="mt-1.5 font-mono text-[9.5px] text-[#4a5568]">{s.shot_size} · {s.lens}</p>
                </div>
              ))}
              {cards.length === 0 && <p className="p-2 text-center text-[11px] text-[#4a5568]">Trống</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================================== QC CENTER ================================== */

const QC_LABELS: Record<string, string> = {
  identity: 'Identity', costume: 'Costume', environment: 'Environment',
  motion: 'Motion', continuity: 'Continuity', artifacts: 'Artifacts',
};

export function QcCenter({ takes, onChanged }: { takes: Take[]; onChanged: () => void }) {
  const qcTakes = takes.filter((t) => ['QC_PROCESSING', 'REJECTED', 'SHORTLISTED', 'APPROVED'].includes(t.status));

  const decide = async (t: Take, status: Take['status']) => {
    await supabase.from('takes').update({ status }).eq('id', t.id);
    if (status === 'APPROVED') {
      const shot = t.shot_id;
      await supabase.from('shots').update({ qc_status: 'PASSED', approval_status: 'APPROVED', generation_status: 'COMPLETED' }).eq('id', shot);
    }
    onChanged();
  };

  if (qcTakes.length === 0) {
    return <EmptyState icon={CheckCircle2} title="Không có take nào đang chờ QC" hint="QC chạy tự động sau mỗi lần generate." />;
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {qcTakes.map((t) => (
        <div key={t.id} className="cineos-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[12.5px] font-bold text-white">TAKE {String(t.take_number).padStart(2, '0')}</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${TAKE_STATUS_STYLE[t.status]}`}>{t.status}</span>
          </div>
          <div className="mb-3 space-y-1.5">
            {Object.entries(t.qc_scores ?? {}).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-20 text-[11px] text-[#8b95a7]">{QC_LABELS[k] ?? k}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#090c11]">
                  <div
                    className={`h-full rounded-full ${v >= 95 ? 'bg-[#55d79b]' : v >= 85 ? 'bg-[#f0bb62]' : 'bg-[#ff6d75]'}`}
                    style={{ width: `${v}%` }}
                  />
                </div>
                <span className="w-7 text-right font-mono text-[10.5px] font-bold text-gray-200">{v}</span>
              </div>
            ))}
          </div>
          {(t.qc_flags ?? []).map((f, i) => (
            <div key={i} className={`mb-1 flex items-start gap-1.5 rounded px-2 py-1 text-[11.5px] ${f.severity === 'Critical' ? 'bg-[#ff6d75]/10 text-[#ff6d75]' : 'bg-[#f0bb62]/10 text-[#f0bb62]'}`}>
              {f.severity === 'Critical' ? <AlertTriangle size={11} className="mt-0.5 shrink-0" /> : <Flag size={11} className="mt-0.5 shrink-0" />}
              {f.severity}: {f.note}
            </div>
          ))}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button onClick={() => decide(t, 'APPROVED')} className="cineos-btn-ghost !py-1.5 !border-[#55d79b]/40 text-[11.5px] !text-[#55d79b]">Approve</button>
            <button onClick={() => decide(t, 'SHORTLISTED')} className="cineos-btn-ghost !py-1.5 text-[11.5px]">Shortlist</button>
            <button onClick={() => decide(t, 'REJECTED')} className="cineos-btn-ghost !py-1.5 !border-[#ff6d75]/40 text-[11.5px] !text-[#ff6d75]">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =============================== CONTINUITY ENGINE ============================= */

export function ContinuityEngine({ shots }: { shots: Shot[] }) {
  const violations = useMemo(() => {
    const out: { shot: string; note: string }[] = [];
    for (const s of shots) {
      if (s.start_state && s.end_state) {
        const next = shots.find((x) => x.scene_id === s.scene_id && x.created_at > s.created_at);
        if (next && next.start_state && next.start_state !== s.end_state && next.start_state !== 'ANY') {
          out.push({ shot: next.shot_code, note: `${s.shot_code} kết thúc với "${s.end_state}" nhưng ${next.shot_code} bắt đầu với "${next.start_state}".` });
        }
      }
    }
    return out;
  }, [shots]);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {violations.length === 0 ? (
        <div className="cineos-card border-[#55d79b]/25 p-4">
          <p className="flex items-center gap-2 text-[13px] font-bold text-[#55d79b]">
            <CheckCircle2 size={14} /> Không phát hiện lỗi continuity
          </p>
          <p className="mt-1 text-[12.5px] text-[#8b95a7]">
            GUARD so sánh end state của mỗi shot với start state của shot kế tiếp trong cùng scene.
          </p>
        </div>
      ) : (
        violations.map((v, i) => (
          <div key={i} className="cineos-card border-[#ff6d75]/30 p-4">
            <p className="flex items-center gap-2 text-[13px] font-bold text-[#ff6d75]">
              <AlertTriangle size={14} /> FLAG ERROR — {v.shot}
            </p>
            <p className="mt-1 text-[12.5px] text-gray-300">{v.note}</p>
          </div>
        ))
      )}
      <div className="cineos-card p-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">State chain</p>
        <div className="space-y-1.5">
          {[...shots].sort((a, b) => a.shot_code.localeCompare(b.shot_code)).map((s) => (
            <p key={s.id} className="font-mono text-[11.5px] text-[#8b95a7]">
              <span className="font-bold text-white">{s.shot_code}</span>
              {'  '}{s.start_state || '∅'} → {s.end_state || '∅'}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================ TAKE MANAGER ================================= */

export function TakeManager({ takes, shots, onChanged }: { takes: Take[]; shots: Shot[]; onChanged: () => void }) {
  const [filterShot, setFilterShot] = useState<string>('all');
  const visible = takes.filter((t) => filterShot === 'all' || t.shot_id === filterShot);

  const act = async (t: Take, action: 'favorite' | 'approve' | 'reject' | 'variation') => {
    if (action === 'favorite') {
      await supabase.from('takes').update({ is_favorite: !t.is_favorite }).eq('id', t.id);
    } else if (action === 'approve') {
      await supabase.from('takes').update({ status: 'APPROVED', selected: true }).eq('id', t.id);
      await supabase.from('takes').update({ selected: false }).eq('shot_id', t.shot_id).neq('id', t.id);
      await supabase.from('shots').update({ approval_status: 'APPROVED' }).eq('id', t.shot_id);
    } else if (action === 'reject') {
      await supabase.from('takes').update({ status: 'REJECTED' }).eq('id', t.id);
    } else {
      const n = takes.filter((x) => x.shot_id === t.shot_id).length + 1;
      await supabase.from('takes').insert({ project_id: t.project_id, shot_id: t.shot_id, take_number: n, status: 'GENERATING' });
    }
    onChanged();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b95a7]">Shot</span>
        <select className="cineos-input !w-auto !py-1.5 text-[12px]" value={filterShot} onChange={(e) => setFilterShot(e.target.value)}>
          <option value="all">Tất cả</option>
          {shots.map((s) => <option key={s.id} value={s.id}>{s.shot_code}</option>)}
        </select>
      </div>
      {visible.length === 0 ? (
        <EmptyState icon={Star} title="Chưa có take nào" hint="Generate take trong Shot Designer." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((t) => (
            <div key={t.id} className="cineos-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[12px] font-bold text-white">
                  {shots.find((s) => s.id === t.shot_id)?.shot_code} · TAKE {String(t.take_number).padStart(2, '0')}
                  {t.is_favorite && <Star size={11} className="ml-1.5 inline fill-[#f0bb62] text-[#f0bb62]" />}
                  {t.selected && <CheckCircle2 size={11} className="ml-1.5 inline text-[#55d79b]" />}
                </p>
                <span className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold ${TAKE_STATUS_STYLE[t.status]}`}>{t.status}</span>
              </div>
              <p className="mb-3 font-mono text-[10.5px] text-[#4a5568]">cost ${t.cost.toFixed(2)}</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => act(t, 'favorite')} className="cineos-btn-ghost !px-2 !py-1 text-[10.5px]">Favorite</button>
                <button onClick={() => act(t, 'approve')} className="cineos-btn-ghost !px-2 !py-1 text-[10.5px] !border-[#55d79b]/40 !text-[#55d79b]">Approve</button>
                <button onClick={() => act(t, 'reject')} className="cineos-btn-ghost !px-2 !py-1 text-[10.5px] !border-[#ff6d75]/40 !text-[#ff6d75]">Reject</button>
                <button onClick={() => act(t, 'variation')} className="cineos-btn-ghost !px-2 !py-1 text-[10.5px]">Variation</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
