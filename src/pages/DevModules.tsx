import { useMemo, useState } from 'react';
import {
  Lightbulb, FlaskConical, Shirt, Mountain, Clapperboard, Cpu,
  Plus, Lock, LockOpen, Sparkles, Search, MapPin, Wand2, CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react';
import { SectionTitle, EmptyState, ProgressBar } from '@/components/ui';
import { supabase } from '@/lib/supabase';

/* ================================== IDEA LAB =================================== */

export interface Idea {
  id: string;
  project_id: string | null;
  title: string;
  body: string | null;
  premise: string | null;
  theme: string | null;
  audience: string | null;
  hook: string | null;
  opportunities: string | null;
  risks: string | null;
  status: string;
  parent_id: string | null;
}

const IDEA_STATUS_TONE: Record<string, string> = {
  DRAFT: 'border-[#303a4b] text-[#8b95a7] bg-[#1b2130]',
  ANALYZED: 'border-[#62a0ff]/30 text-[#62a0ff] bg-[#62a0ff]/10',
  VARIANT: 'border-[#f0bb62]/30 text-[#f0bb62] bg-[#f0bb62]/10',
  MERGED: 'border-[#8a78ff]/30 text-[#a99dff] bg-[#8a78ff]/10',
  LOCKED: 'border-[#55d79b]/30 text-[#55d79b] bg-[#55d79b]/10',
};

export function IdeaLab({ ideas, onChanged }: { ideas: Idea[]; onChanged: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const selected = ideas.find((i) => i.id === selectedId) ?? null;

  const analyze = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    await supabase.from('ideas').insert({
      project_id: ideas[0]?.project_id ?? null,
      title: draft.trim().slice(0, 60),
      body: draft.trim(),
      premise: draft.trim().split('.')[0].slice(0, 140),
      status: 'ANALYZED',
    });
    setDraft('');
    setBusy(false);
    onChanged();
  };

  const createVariant = async (src: Idea) => {
    setBusy(true);
    await supabase.from('ideas').insert({
      project_id: src.project_id,
      title: `${src.title} — biến thể ${Math.floor(Math.random() * 90) + 10}`,
      body: src.body,
      parent_id: src.id,
      status: 'VARIANT',
    });
    setBusy(false);
    onChanged();
  };

  const toggleLock = async (i: Idea) => {
    await supabase.from('ideas').update({ status: i.status === 'LOCKED' ? 'ANALYZED' : 'LOCKED' }).eq('id', i.id);
    onChanged();
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="min-h-0 overflow-y-auto pr-1">
        <div className="cineos-panel p-4">
          <p className="mb-2 flex items-center gap-2 text-[13px] font-extrabold text-white">
            <Lightbulb size={14} className="text-[#f0bb62]" /> Ý tưởng mới
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder="Mô tả ý tưởng phim: ai, điều gì xảy ra, vì sao khán giả quan tâm..."
            className="cineos-input w-full resize-none text-[12.5px] leading-relaxed"
          />
          <button onClick={analyze} disabled={busy || !draft.trim()} className="cineos-btn-primary mt-2 w-full !py-2 text-[12px]">
            <Sparkles size={12} /> Phân tích với NOVA
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {ideas.map((i) => (
            <button
              key={i.id}
              onClick={() => setSelectedId(i.id === selectedId ? null : i.id)}
              className={`cineos-card w-full p-3 text-left transition-colors ${i.id === selectedId ? 'border-[#8a78ff]/60' : ''}`}
            >
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-white">{i.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold ${IDEA_STATUS_TONE[i.status] ?? IDEA_STATUS_TONE.DRAFT}`}>{i.status}</span>
              </div>
              {i.hook && <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-[#8b95a7]">{i.hook}</p>}
            </button>
          ))}
          {ideas.length === 0 && <EmptyState icon={Lightbulb} title="Chưa có idea" hint="Nhập ý tưởng rồi để NOVA phân tích." />}
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto pr-1">
        {selected ? (
          <div className="cineos-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[14px] font-extrabold text-white">AI Analysis</p>
              <div className="flex gap-1.5">
                <button onClick={() => createVariant(selected)} className="cineos-btn-ghost !px-2 !py-1 text-[10.5px]">Tạo biến thể</button>
                <button onClick={() => toggleLock(selected)} className={`cineos-btn-ghost !px-2 !py-1 text-[10.5px] ${selected.status === 'LOCKED' ? '!border-[#55d79b]/40 !text-[#55d79b]' : ''}`}>
                  {selected.status === 'LOCKED' ? <Lock size={10} /> : <LockOpen size={10} />} {selected.status === 'LOCKED' ? 'Đã khóa' : 'Khóa'}
                </button>
              </div>
            </div>
            <div className="space-y-2.5 text-[12.5px] leading-relaxed">
              {([['Premise', selected.premise], ['Theme', selected.theme], ['Audience', selected.audience], ['Hook', selected.hook], ['Opportunities', selected.opportunities], ['Risks', selected.risks]] as const).map(([label, val]) => (
                <div key={label} className="rounded-lg bg-[#0f131a] p-3">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#a99dff]">{label}</p>
                  <p className="mt-1 text-[#d3dae6]">{val ?? '—'}</p>
                </div>
              ))}
              {selected.body && (
                <div className="rounded-lg bg-[#0f131a] p-3">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#8b95a7]">Nội dung gốc</p>
                  <p className="mt-1 whitespace-pre-wrap text-[#8b95a7]">{selected.body}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState icon={Sparkles} title="Chọn một idea" hint="Xem phân tích Premise / Theme / Audience / Hook / Opportunities / Risks." />
        )}
      </div>
    </div>
  );
}

/* ================================ RESEARCH ROOM ================================ */

export interface ResearchTopic {
  id: string;
  project_id: string | null;
  topic: string;
  findings: string | null;
  sources: string[];
  relevance: string | null;
  used_in: string[];
  reliability: number;
  notes: string | null;
}

export function ResearchRoom({ topics, onChanged }: { topics: ResearchTopic[]; onChanged: () => void }) {
  const [query, setQuery] = useState('');
  const visible = topics.filter((t) => query === '' || t.topic.toLowerCase().includes(query.toLowerCase()));

  const add = async () => {
    await supabase.from('research_topics').insert({
      project_id: topics[0]?.project_id ?? null,
      topic: 'Chủ đề nghiên cứu mới',
      reliability: 50,
    });
    onChanged();
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4a5568]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm chủ đề..." className="cineos-input !w-56 !py-1.5 pl-8 text-[12px]" />
        </div>
        <button onClick={add} className="cineos-btn-ghost ml-auto !py-1.5 text-[12px]"><Plus size={12} /> Thêm chủ đề</button>
      </div>
      {visible.length === 0 ? (
        <EmptyState icon={FlaskConical} title="Chưa có research" hint="Mỗi phát hiện được gắn với Character / Scene / Episode / Bible." />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {visible.map((t) => (
            <div key={t.id} className="cineos-card p-4">
              <p className="text-[13px] font-extrabold text-white">{t.topic}</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#8b95a7]">{t.findings ?? '—'}</p>
              {(t.sources ?? []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.sources.map((s, i) => <span key={i} className="cineos-chip !px-1.5 !py-0.5 !text-[9.5px]">{s}</span>)}
                </div>
              )}
              {t.relevance && <p className="mt-2 text-[11.5px] text-[#a99dff]">Relevance: {t.relevance}</p>}
              {(t.used_in ?? []).length > 0 && (
                <p className="mt-1 font-mono text-[10px] text-[#4a5568]">Used in: {t.used_in.join(' · ')}</p>
              )}
              <div className="mt-2.5 flex items-center gap-2">
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-[#8b95a7]">Reliability</span>
                <ProgressBar value={t.reliability} className="!h-1.5 flex-1" />
                <span className={`font-mono text-[11px] font-bold ${t.reliability >= 80 ? 'text-[#55d79b]' : t.reliability >= 60 ? 'text-[#f0bb62]' : 'text-[#ff6d75]'}`}>{t.reliability}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================ COSTUME STUDIO =============================== */

export interface Costume {
  id: string;
  project_id: string | null;
  character_id: string | null;
  slot: string;
  name: string;
  description: string | null;
  state: string;
  locked: boolean;
}

const SLOTS = ['HOME', 'SCHOOL', 'OUTDOOR', 'SLEEPWEAR', 'SPECIAL'] as const;
const CStates = ['CLEAN', 'WET', 'DIRTY', 'DAMAGED'] as const;

const STATE_TONE: Record<string, string> = {
  CLEAN: 'border-[#55d79b]/30 text-[#55d79b] bg-[#55d79b]/10',
  WET: 'border-[#62a0ff]/30 text-[#62a0ff] bg-[#62a0ff]/10',
  DIRTY: 'border-[#f0bb62]/30 text-[#f0bb62] bg-[#f0bb62]/10',
  DAMAGED: 'border-[#ff6d75]/30 text-[#ff6d75] bg-[#ff6d75]/10',
};

export function CostumeStudio({ costumes, characterNames, onChanged }: { costumes: Costume[]; characterNames: Record<string, string>; onChanged: () => void }) {
  const [charId, setCharId] = useState<string | null>(null);
  const active = charId ?? Object.keys(characterNames)[0] ?? null;
  const visible = costumes.filter((c) => c.character_id === active);
  const activeName = characterNames[active ?? ''] ?? '—';

  const cycleState = async (c: Costume) => {
    const next = CStates[(CStates.indexOf(c.state as typeof CStates[number]) + 1) % CStates.length];
    await supabase.from('costumes').update({ state: next }).eq('id', c.id);
    onChanged();
  };

  const toggleLock = async (c: Costume) => {
    await supabase.from('costumes').update({ locked: !c.locked }).eq('id', c.id);
    onChanged();
  };

  const addCostume = async () => {
    if (!active) return;
    await supabase.from('costumes').insert({
      project_id: costumes[0]?.project_id,
      character_id: active,
      slot: SLOTS.filter((s) => !visible.some((v) => v.slot === s))[0] ?? 'HOME',
      name: 'Trang phục mới',
      state: 'CLEAN',
    });
    onChanged();
  };

  return (
    <div className="flex gap-4">
      <div className="w-48 shrink-0 space-y-1">
        {Object.entries(characterNames).map(([id, name]) => (
          <button key={id} onClick={() => setCharId(id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-[12.5px] font-semibold transition-colors ${id === active ? 'bg-[#8a78ff]/15 text-[#a99dff]' : 'text-[#8b95a7] hover:bg-[#1b2130] hover:text-white'}`}>
            {name}
          </button>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-[14px] font-extrabold text-white"><Shirt size={15} className="text-[#a99dff]" /> {activeName} — tủ trang phục</p>
          <button onClick={addCostume} className="cineos-btn-ghost !py-1.5 text-[11.5px]"><Plus size={11} /> Thêm</button>
        </div>
        {visible.length === 0 ? (
          <EmptyState icon={Shirt} title="Chưa có trang phục" hint="5 slot: Home, School, Outdoor, Sleepwear, Special." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {SLOTS.map((slot) => {
              const item = visible.find((v) => v.slot === slot);
              if (!item) return (
                <div key={slot} className="cineos-card border-dashed p-4 opacity-50">
                  <p className="font-mono text-[9.5px] uppercase tracking-wider text-[#4a5568]">{slot}</p>
                  <p className="mt-1 text-[12px] text-[#8b95a7]">— trống —</p>
                </div>
              );
              return (
                <div key={slot} className="cineos-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[9.5px] uppercase tracking-wider text-[#a99dff]">{slot}</p>
                    <button onClick={() => toggleLock(item)} className={item.locked ? 'text-[#55d79b]' : 'text-[#4a5568] hover:text-white'}>
                      {item.locked ? <Lock size={11} /> : <LockOpen size={11} />}
                    </button>
                  </div>
                  <p className="mt-1 text-[13px] font-bold text-white">{item.name}</p>
                  {item.description && <p className="mt-1 text-[11.5px] leading-relaxed text-[#8b95a7]">{item.description}</p>}
                  <button onClick={() => cycleState(item)} className={`mt-2 rounded-full border px-2 py-0.5 text-[9.5px] font-bold transition-colors hover:opacity-80 ${STATE_TONE[item.state]}`}>
                    {item.state} — nhấn đổi
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== ENVIRONMENT STUDIO ============================= */

export interface Environment {
  id: string;
  project_id: string | null;
  location_id: string | null;
  overview: string | null;
  architecture: string | null;
  furniture: string | null;
  palette: string | null;
  lighting: string | null;
  camera_angles: string[];
  time_variants: string[];
  references_note: string | null;
  version: number;
}

export function EnvironmentStudio({ environments, locationNames, onChanged }: { environments: Environment[]; locationNames: Record<string, string>; onChanged: () => void }) {
  const [locId, setLocId] = useState<string | null>(null);
  const active = locId ?? Object.keys(locationNames)[0] ?? null;
  const env = environments.find((e) => e.location_id === active);
  const activeName = locationNames[active ?? ''] ?? '—';

  const bumpVersion = async () => {
    if (!env) return;
    await supabase.from('environments').update({ version: env.version + 1 }).eq('id', env.id);
    onChanged();
  };

  return (
    <div className="flex gap-4">
      <div className="w-48 shrink-0 space-y-1">
        {Object.entries(locationNames).map(([id, name]) => (
          <button key={id} onClick={() => setLocId(id)}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12.5px] font-semibold transition-colors ${id === active ? 'bg-[#8a78ff]/15 text-[#a99dff]' : 'text-[#8b95a7] hover:bg-[#1b2130] hover:text-white'}`}>
            <MapPin size={12} /> {name}
          </button>
        ))}
        {Object.keys(locationNames).length === 0 && <p className="px-3 text-[11.5px] text-[#4a5568]">Chưa có location nào.</p>}
      </div>
      <div className="min-w-0 flex-1">
        {env ? (
          <div className="cineos-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-[14px] font-extrabold text-white"><Mountain size={15} className="text-[#a99dff]" /> {activeName}</p>
              <button onClick={bumpVersion} className="cineos-btn-ghost !py-1.5 text-[11px]">Version {env.version} +1</button>
            </div>
            <p className="mb-4 text-[12.5px] leading-relaxed text-[#d3dae6]">{env.overview}</p>
            <div className="grid gap-2.5 text-[12.5px] leading-relaxed sm:grid-cols-2">
              {([['Architecture', env.architecture], ['Furniture', env.furniture], ['Palette', env.palette], ['Lighting', env.lighting]] as const).map(([label, val]) => (
                <div key={label} className="rounded-lg bg-[#0f131a] p-3">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#a99dff]">{label}</p>
                  <p className="mt-1 text-[#d3dae6]">{val ?? '—'}</p>
                </div>
              ))}
              <div className="rounded-lg bg-[#0f131a] p-3 sm:col-span-2">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#a99dff]">Camera Angles</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(env.camera_angles ?? []).map((a, i) => <span key={i} className="cineos-chip !text-[10px]">{a}</span>)}
                </div>
                <p className="mt-3 font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#a99dff]">Time Variants</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(env.time_variants ?? []).map((a, i) => <span key={i} className="cineos-chip !text-[10px]">{a}</span>)}
                </div>
              </div>
              {env.references_note && (
                <div className="rounded-lg bg-[#0f131a] p-3 sm:col-span-2">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#a99dff]">References</p>
                  <p className="mt-1 text-[#8b95a7]">{env.references_note}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState icon={Mountain} title="Chưa có environment profile" hint="Mỗi location có master visual: architecture, furniture, palette, lighting, camera angles, time variants." />
        )}
      </div>
    </div>
  );
}

/* =================================== ANIMATIC ================================== */

export interface AnimaticFrame {
  id: string;
  scene_id: string | null;
  frame_number: number;
  shot_suggestion: string | null;
  duration_s: number | null;
  action: string | null;
  dialogue: string | null;
  status: string | null;
}

export function Animatic({ frames, sceneNames, musicCues }: { frames: AnimaticFrame[]; sceneNames: Record<string, string>; musicCues: string[] }) {
  const [activeScene, setActiveScene] = useState<string | null>(null);
  const sceneIds = useMemo(() => [...new Set(frames.map((f) => f.scene_id).filter(Boolean) as string[])], [frames]);
  const active = activeScene ?? sceneIds[0] ?? null;
  const visible = frames.filter((f) => f.scene_id === active).sort((a, b) => a.frame_number - b.frame_number);
  const total = visible.reduce((s, f) => s + (f.duration_s ?? 3), 0);

  let acc = 0;
  const laid = visible.map((f) => {
    const start = acc;
    acc += f.duration_s ?? 3;
    return { ...f, start };
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {sceneIds.map((id) => (
          <button key={id} onClick={() => setActiveScene(id)}
            className={`rounded-lg border px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${id === active ? 'border-[#8a78ff]/50 bg-[#8a78ff]/15 text-[#a99dff]' : 'border-[#242c3a] bg-[#151a23] text-[#8b95a7] hover:text-white'}`}>
            {sceneNames[id] ?? 'Scene'}
          </button>
        ))}
        <span className="ml-auto self-center font-mono text-[11px] text-[#8b95a7]">{visible.length} frames · ~{total}s</span>
      </div>
      {visible.length === 0 ? (
        <EmptyState icon={Clapperboard} title="Chưa có frame" hint="Tạo storyboard trước để dựng animatic." />
      ) : (
        <>
          <div className="cineos-panel space-y-2 p-4">
            <div className="mb-1 flex justify-between font-mono text-[9.5px] text-[#4a5568]">
              <span>00:00</span><span>{Math.floor(total / 2)}s</span><span>{total}s</span>
            </div>
            <Track label="STORYBOARD" tone="bg-[#8a78ff]/20 border-l-2 border-[#8a78ff]">
              {laid.map((f) => (
                <div key={f.id} className="absolute inset-y-0 flex items-center overflow-hidden border-r border-[#0f131a] px-1"
                  style={{ left: `${(f.start / (total || 1)) * 100}%`, width: `${((f.duration_s ?? 3) / (total || 1)) * 100}%` }}>
                  <span className="truncate font-mono text-[9px] font-bold text-white">{f.shot_suggestion}</span>
                </div>
              ))}
            </Track>
            <Track label="DIALOGUE" tone="bg-[#62a0ff]/15 border-l-2 border-[#62a0ff]">
              {laid.filter((f) => f.dialogue).map((f) => (
                <div key={f.id} title={f.dialogue ?? ''} className="absolute inset-y-1 flex items-center rounded bg-[#62a0ff]/40 px-1"
                  style={{ left: `${(f.start / (total || 1)) * 100}%`, width: `${((f.duration_s ?? 3) / (total || 1)) * 100}%` }}>
                  <span className="truncate font-mono text-[8.5px] text-white">✓ thoại</span>
                </div>
              ))}
            </Track>
            <Track label="TEMP MUSIC" tone="bg-[#55d79b]/15 border-l-2 border-[#55d79b]">
              {(musicCues.length > 0 ? musicCues : ['Theme']).map((cue, i) => (
                <div key={i} className="absolute inset-y-1 flex items-center rounded bg-[#55d79b]/35 px-2"
                  style={{ left: `${(i / (musicCues.length || 1)) * 100}%`, width: `${(1 / (musicCues.length || 1)) * 100 - 1}%` }}>
                  <span className="truncate font-mono text-[8.5px] text-white">{cue}</span>
                </div>
              ))}
            </Track>
            <Track label="TEMP SFX" tone="bg-[#f0bb62]/15 border-l-2 border-[#f0bb62]">
              {laid.map((f) => (
                <div key={f.id} title={f.action ?? ''} className="absolute flex items-center justify-center rounded bg-[#f0bb62]/40"
                  style={{ left: `${((f.start + (f.duration_s ?? 3) / 2) / (total || 1)) * 100}%`, width: '3%', top: 4, bottom: 4 }}>
                  <span className="font-mono text-[8px] text-white">●</span>
                </div>
              ))}
            </Track>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-[#4a5568]">
            Animatic cho đánh giá pacing trước khi generate video: nhịp frame, chỗ nào thoại, chỗ nào nhạc cue và SFX rơi vào đâu.
          </p>
        </>
      )}
    </div>
  );
}

function Track({ label, tone, children }: { label: string; tone: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 font-mono text-[9px] font-bold tracking-[0.1em] text-[#8b95a7]">{label}</span>
      <div className={`relative h-8 flex-1 overflow-hidden rounded-lg bg-[#090c11] border-l-2 ${tone}`}>
        {children}
      </div>
    </div>
  );
}

/* ================================ AI MODEL ROUTER ============================== */

export interface ModelEntry {
  id: string;
  project_id: string | null;
  name: string;
  type: string;
  provider: string;
  quality: number;
  cost_per_unit: number;
  speed: string | null;
  reference_url: string | null;
  duration_note: string | null;
  availability: string;
}

const MODEL_TYPE_TONE: Record<string, string> = {
  LLM: 'text-[#a99dff] bg-[#8a78ff]/10 border-[#8a78ff]/25',
  IMAGE: 'text-[#62a0ff] bg-[#62a0ff]/10 border-[#62a0ff]/25',
  VIDEO: 'text-[#f0bb62] bg-[#f0bb62]/10 border-[#f0bb62]/25',
  VOICE: 'text-[#55d79b] bg-[#55d79b]/10 border-[#55d79b]/25',
  MUSIC: 'text-[#ff9d62] bg-[#ff9d62]/10 border-[#ff9d62]/25',
};

export function ModelRouter({ models }: { models: ModelEntry[] }) {
  const [mode, setMode] = useState<'AUTO' | 'PROJECT_DEFAULT' | 'SHOT_OVERRIDE'>('AUTO');

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['AUTO', 'PROJECT_DEFAULT', 'SHOT_OVERRIDE'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] font-bold transition-colors ${mode === m ? 'border-[#8a78ff]/50 bg-[#8a78ff]/15 text-[#a99dff]' : 'border-[#242c3a] bg-[#151a23] text-[#8b95a7] hover:text-white'}`}>
            {m.replace('_', ' ')}
          </button>
        ))}
        <p className="ml-auto max-w-sm text-[11px] text-[#4a5568]">
          {mode === 'AUTO' && 'Router tự chọn model tốt nhất theo budget + chất lượng từng loại job.'}
          {mode === 'PROJECT_DEFAULT' && 'Cả project dùng model mặc định được khóa bên dưới.'}
          {mode === 'SHOT_OVERRIDE' && 'Từng shot được phép chỉ định model riêng trong Shot Designer.'}
        </p>
      </div>
      <div className="cineos-panel overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-[#242c3a] font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#8b95a7]">
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Quality</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Speed</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id} className="border-b border-[#151a23] last:border-0 hover:bg-[#131926]">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2 font-bold text-white"><Cpu size={12} className="text-[#a99dff]" /> {m.name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold ${MODEL_TYPE_TONE[m.type] ?? MODEL_TYPE_TONE.LLM}`}>{m.type}</span>
                </td>
                <td className="px-4 py-3 text-[#8b95a7]">{m.provider}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={m.quality} className="!h-1.5 w-16" />
                    <span className="font-mono text-[11px] text-gray-200">{m.quality}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-[#f0bb62]">${Number(m.cost_per_unit).toFixed(3)}</td>
                <td className="px-4 py-3 text-[11.5px] text-[#8b95a7]">{m.speed ?? '—'}</td>
                <td className="px-4 py-3 text-[11.5px] text-[#8b95a7]">{m.duration_note ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 font-mono text-[10.5px] font-bold ${m.availability === 'AVAILABLE' ? 'text-[#55d79b]' : m.availability === 'BETA' ? 'text-[#f0bb62]' : 'text-[#ff6d75]'}`}>
                    {m.availability === 'AVAILABLE' ? <CheckCircle2 size={11} /> : m.availability === 'BETA' ? <AlertTriangle size={11} /> : <XCircle size={11} />}
                    {m.availability}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {models.length === 0 && <EmptyState icon={Wand2} title="Chưa có model nào" />}
    </div>
  );
}
