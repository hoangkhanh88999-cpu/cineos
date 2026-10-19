import { useMemo, useState } from 'react';
import {
  FolderOpen, Plus, Send, Music, Mic, SlidersHorizontal, FileText, Image as ImageIcon,
  Video, Layers, Search, Rocket,
} from 'lucide-react';
import { SectionTitle, EmptyState, ProgressBar } from '@/components/ui';
import { supabase } from '@/lib/supabase';

/* ================================ ASSET LIBRARY ================================ */

export interface Asset {
  id: string;
  project_id: string;
  name: string;
  type: string;
  collection: string | null;
  ref_id: string | null;
  url: string | null;
  meta: Record<string, unknown> | null;
  tags: string[];
  created_at: string;
}

const TYPE_ICON: Record<string, typeof ImageIcon> = {
  CHARACTER: Mic, LOCATION: ImageIcon, PROP: Layers, VIDEO: Video,
  IMAGE: ImageIcon, AUDIO: Music, PROMPT: FileText, DOCUMENT: FileText,
};

const TYPE_TONE: Record<string, string> = {
  CHARACTER: 'text-[#a99dff] bg-[#8a78ff]/10 border-[#8a78ff]/25',
  LOCATION: 'text-[#62a0ff] bg-[#62a0ff]/10 border-[#62a0ff]/25',
  PROP: 'text-[#55d79b] bg-[#55d79b]/10 border-[#55d79b]/25',
  VIDEO: 'text-[#f0bb62] bg-[#f0bb62]/10 border-[#f0bb62]/25',
  IMAGE: 'text-[#62a0ff] bg-[#62a0ff]/10 border-[#62a0ff]/25',
  AUDIO: 'text-[#55d79b] bg-[#55d79b]/10 border-[#55d79b]/25',
  PROMPT: 'text-[#8b95a7] bg-[#1b2130] border-[#303a4b]',
  DOCUMENT: 'text-[#8b95a7] bg-[#1b2130] border-[#303a4b]',
};

const ASSET_TYPES = ['ALL', 'CHARACTER', 'LOCATION', 'PROP', 'VIDEO', 'IMAGE', 'AUDIO', 'PROMPT', 'DOCUMENT'];

export function AssetLibrary({ assets, onChanged }: { assets: Asset[]; onChanged: () => void }) {
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'GRID' | 'LIST' | 'COLLECTIONS'>('GRID');
  const [busy, setBusy] = useState(false);

  const visible = useMemo(
    () =>
      assets.filter(
        (a) =>
          (typeFilter === 'ALL' || a.type === typeFilter) &&
          (query === '' || a.name.toLowerCase().includes(query.toLowerCase()) || (a.tags ?? []).some((t) => t.includes(query.toLowerCase())))
      ),
    [assets, typeFilter, query]
  );

  const collections = useMemo(() => {
    const map = new Map<string, Asset[]>();
    for (const a of assets) {
      const key = a.collection ?? 'Uncategorized';
      map.set(key, [...(map.get(key) ?? []), a]);
    }
    return [...map.entries()];
  }, [assets]);

  const addAsset = async () => {
    setBusy(true);
    await supabase.from('assets').insert({
      project_id: assets[0]?.project_id,
      name: `New asset ${new Date().toLocaleTimeString('vi-VN')}`,
      type: 'DOCUMENT',
      collection: 'Uncategorized',
    });
    setBusy(false);
    onChanged();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4a5568]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm asset..."
            className="cineos-input !w-52 !py-1.5 pl-8 text-[12px]"
          />
        </div>
        <select className="cineos-input !w-auto !py-1.5 text-[12px]" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {ASSET_TYPES.map((t) => <option key={t}>{t === 'ALL' ? 'Tất cả loại' : t}</option>)}
        </select>
        <div className="flex overflow-hidden rounded-lg border border-[#242c3a]">
          {(['GRID', 'LIST', 'COLLECTIONS'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1.5 font-mono text-[10px] font-bold transition-colors ${
                view === v ? 'bg-[#8a78ff]/15 text-[#a99dff]' : 'text-[#8b95a7] hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <button onClick={addAsset} disabled={busy} className="cineos-btn-ghost ml-auto !py-1.5 text-[12px]">
          <Plus size={12} /> Thêm asset
        </button>
      </div>

      {visible.length === 0 && assets.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Thư viện trống" hint="Asset xuất hiện khi characters, locations, prompts, storyboard được tạo." />
      ) : view === 'COLLECTIONS' ? (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {collections.map(([col, items]) => (
            <div key={col}>
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a99dff]">{col} · {items.length}</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((a) => <AssetCard key={a.id} asset={a} />)}
              </div>
            </div>
          ))}
        </div>
      ) : view === 'LIST' ? (
        <div className="cineos-panel min-h-0 flex-1 overflow-y-auto p-3">
          {visible.map((a) => (
            <div key={a.id} className="flex items-center gap-3 border-b border-[#151a23] px-2 py-2.5 last:border-0">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${TYPE_TONE[a.type] ?? TYPE_TONE.DOCUMENT}`}>
                {(TYPE_ICON[a.type] ?? FileText)({ size: 12 })}
              </span>
              <p className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-gray-200">{a.name}</p>
              <span className="font-mono text-[10px] text-[#4a5568]">{a.type}</span>
              <span className="hidden font-mono text-[10px] text-[#4a5568] sm:block">{a.collection ?? '—'}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((a) => <AssetCard key={a.id} asset={a} />)}
        </div>
      )}
    </div>
  );
}

function AssetCard({ asset: a }: { asset: Asset }) {
  const Icon = TYPE_ICON[a.type] ?? FileText;
  return (
    <div className="cineos-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${TYPE_TONE[a.type] ?? TYPE_TONE.DOCUMENT}`}>
          <Icon size={14} />
        </span>
        <span className="font-mono text-[9.5px] uppercase tracking-wider text-[#4a5568]">{a.type}</span>
      </div>
      <p className="truncate text-[13px] font-bold text-white">{a.name}</p>
      <p className="mt-0.5 text-[11px] text-[#8b95a7]">{a.collection ?? 'Uncategorized'}</p>
      {(a.tags ?? []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {a.tags.map((t) => <span key={t} className="cineos-chip !px-1.5 !py-0.5 !text-[9.5px]">{t}</span>)}
        </div>
      )}
    </div>
  );
}

/* =============================== MUSIC & SOUND ================================= */

const MUSIC_TABS = ['Themes', 'Music cues', 'Ambience', 'SFX', 'Foley', 'Mix'] as const;

export function MusicSound() {
  const [tab, setTab] = useState<(typeof MUSIC_TABS)[number]>('Themes');
  const [feedback, setFeedback] = useState<string | null>(null);

  const request = async (what: string) => {
    setFeedback(`ECHO đã nhận yêu cầu ${what} — hàng đợi audio sẽ xử lý sau video generation.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {MUSIC_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              tab === t ? 'border-[#8a78ff]/50 bg-[#8a78ff]/15 text-[#a99dff]' : 'border-[#242c3a] bg-[#151a23] text-[#8b95a7] hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="cineos-panel p-5">
        <p className="mb-1 flex items-center gap-2 text-[14px] font-extrabold text-white">
          <Music size={15} className="text-[#a99dff]" /> {tab}
        </p>
        <p className="mb-4 text-[12.5px] leading-relaxed text-[#8b95a7]">
          {tab === 'Themes' && 'Nhạc chủ đề của series — biến thể warm và playful cho opening và payoff.'}
          {tab === 'Music cues' && 'Nhạc cue theo beat: Incident sting, Mission theme, Payoff swell.'}
          {tab === 'Ambience' && 'Âm nền theo location: tiếng chim sân sau, tiếng bếp, tiếng phố buổi sáng.'}
          {tab === 'SFX' && 'Hiệu ứng âm thanh: đổ sữa, trượt ván, tên lửa giấy phóng.'}
          {tab === 'Foley' && 'Foley bước chân, tiếng vải áo choàng, tiếng giấy gấp.'}
          {tab === 'Mix' && 'Mix level: dialogue -6dB, music -18dB, SFX -12dB. Xuất rough mix cùng animatic.'}
        </p>
        {feedback && (
          <div className="cineos-card mb-4 border-[#55d79b]/30 p-3">
            <p className="text-[12.5px] text-[#55d79b]">{feedback}</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(tab === 'Themes'
            ? [['Explorer Main Theme', 'Warm orchestral + whistle', '1:12', 'APPROVED'],
               ['Mission Mini-Theme', 'Playful pizzicato', '0:38', 'DRAFT']]
            : tab === 'Music cues'
              ? [['CUE-01 Incident Sting', 'Comedy record-scratch', '0:04', 'APPROVED'],
                 ['CUE-02 Mission Build', 'Rising drums + strings', '0:22', 'DRAFT'],
                 ['CUE-03 Payoff Swell', 'Warm strings swell', '0:30', 'DRAFT']]
              : tab === 'Ambience'
                ? [['AMB-Kitchen Morning', 'Birds + fridge hum + distant traffic', '2:00', 'APPROVED'],
                   ['AMB-Living Room', 'Clock tick, quiet room tone', '2:00', 'DRAFT']]
                : tab === 'SFX'
                  ? [['SFX-Milk Spill', 'Liquid splash + carton thud', '0:02', 'APPROVED'],
                     ['SFX-Rocket Launch', 'Paper whoosh + kid gleeful shout', '0:03', 'DRAFT']]
                  : tab === 'Foley'
                    ? [['FOL-Cape Swoosh', 'Fabric whip', '0:01', 'DRAFT'],
                       ['FOL-Paper Fold', 'Crisp paper crease', '0:01', 'DRAFT']]
                    : [['Dialogue bus', '-6dB, gentle compression', '—', 'LOCKED'],
                       ['Music bus', '-18dB under dialogue', '—', 'LOCKED'],
                       ['SFX bus', '-12dB, panned per action', '—', 'LOCKED']]
          ).map(([name, desc, dur, status]) => (
            <div key={name} className="cineos-card p-4">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[12.5px] font-bold text-white">{name}</p>
                <span className="font-mono text-[10px] text-[#8b95a7]">{dur}</span>
              </div>
              <p className="text-[11.5px] text-[#8b95a7]">{desc}</p>
              <div className="mt-2.5 flex items-center justify-between">
                <span className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold ${
                  status === 'APPROVED' || status === 'LOCKED'
                    ? 'border-[#55d79b]/30 text-[#55d79b] bg-[#55d79b]/10'
                    : 'border-[#303a4b] text-[#8b95a7] bg-[#1b2130]'
                }`}>{status}</span>
                {status !== 'LOCKED' && (
                  <button onClick={() => request(name)} className="cineos-btn-ghost !px-2 !py-1 text-[10.5px]">
                    <SlidersHorizontal size={10} /> Yêu cầu ECHO
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================ VOICE STUDIO ================================= */

export interface VoiceProfile {
  id: string;
  project_id: string | null;
  character_id: string | null;
  voice: string;
  language: string;
  accent: string | null;
  emotion: string | null;
  energy: number;
  pitch: string | null;
  speed: string | null;
  notes: string | null;
}

export function VoiceStudio({ profiles, characterNames, onChanged }: { profiles: VoiceProfile[]; characterNames: Record<string, string>; onChanged: () => void }) {
  const setEnergy = async (p: VoiceProfile, energy: number) => {
    await supabase.from('voice_profiles').update({ energy }).eq('id', p.id);
    onChanged();
  };

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {profiles.length === 0 && <EmptyState icon={Mic} title="Chưa có voice profile" hint="Tạo character trong Character Studio trước." />}
      {profiles.map((p) => (
        <div key={p.id} className="cineos-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-[13.5px] font-extrabold text-white">
              <Mic size={13} className="text-[#a99dff]" /> {characterNames[p.character_id ?? ''] ?? 'Character'}
            </p>
            <span className="cineos-chip !text-[9.5px]">{p.voice}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
            <p className="text-[#8b95a7]">Language: <span className="text-gray-200">{p.language}</span></p>
            <p className="text-[#8b95a7]">Accent: <span className="text-gray-200">{p.accent}</span></p>
            <p className="text-[#8b95a7]">Emotion: <span className="text-gray-200">{p.emotion}</span></p>
            <p className="text-[#8b95a7]">Pitch: <span className="text-gray-200">{p.pitch}</span></p>
            <p className="text-[#8b95a7]">Speed: <span className="text-gray-200">{p.speed}</span></p>
            <p className="text-[#8b95a7]">Energy: <span className="font-mono text-gray-200">{p.energy}%</span></p>
          </div>
          <input
            type="range" min={0} max={100} value={p.energy}
            onChange={(e) => setEnergy(p, Number(e.target.value))}
            className="mt-3 w-full accent-[#8a78ff]"
          />
          {p.notes && <p className="mt-2 text-[11.5px] leading-relaxed text-[#4a5568]">{p.notes}</p>}
        </div>
      ))}
    </div>
  );
}

/* =============================== RELEASE STUDIO ================================ */

export interface ReleaseOutput {
  id: string;
  project_id: string;
  kind: string;
  title: string | null;
  status: 'NOT_STARTED' | 'QUEUED' | 'GENERATING' | 'REVIEW' | 'APPROVED' | 'PUBLISHED';
  duration_s: number | null;
  language: string | null;
  notes: string | null;
}

const RELEASE_STATUS: Record<string, string> = {
  NOT_STARTED: 'border-[#303a4b] text-[#8b95a7] bg-[#1b2130]',
  QUEUED: 'border-[#62a0ff]/30 text-[#62a0ff] bg-[#62a0ff]/10',
  GENERATING: 'border-[#8a78ff]/30 text-[#a99dff] bg-[#8a78ff]/10',
  REVIEW: 'border-[#f0bb62]/30 text-[#f0bb62] bg-[#f0bb62]/10',
  APPROVED: 'border-[#55d79b]/30 text-[#55d79b] bg-[#55d79b]/10',
  PUBLISHED: 'border-[#55d79b]/40 text-[#55d79b] bg-[#55d79b]/20',
};

const NEXT_STATUS: Record<ReleaseOutput['status'], ReleaseOutput['status']> = {
  NOT_STARTED: 'QUEUED',
  QUEUED: 'GENERATING',
  GENERATING: 'REVIEW',
  REVIEW: 'APPROVED',
  APPROVED: 'PUBLISHED',
  PUBLISHED: 'PUBLISHED',
};

export function ReleaseStudio({ outputs, onChanged }: { outputs: ReleaseOutput[]; onChanged: () => void }) {
  const advance = async (o: ReleaseOutput) => {
    await supabase.from('release_outputs').update({ status: NEXT_STATUS[o.status] }).eq('id', o.id);
    onChanged();
  };

  return (
    <div>
      <div className="cineos-card mb-4 flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8a78ff]/15 text-[#a99dff]">
          <Rocket size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-white">Input: MASTER</p>
          <p className="text-[11.5px] text-[#8b95a7]">Mỗi sản phẩm bên dưới được sinh từ master đã khóa — trailer, teaser, poster, short, phụ đề...</p>
        </div>
        <span className="font-mono text-[11px] text-[#8b95a7]">{outputs.filter((o) => o.status === 'PUBLISHED').length}/{outputs.length} published</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {outputs.map((o) => (
          <div key={o.id} className="cineos-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#a99dff]">{o.kind}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold ${RELEASE_STATUS[o.status]}`}>{o.status}</span>
            </div>
            <p className="text-[13.5px] font-bold text-white">{o.title}</p>
            {o.duration_s && <p className="mt-0.5 font-mono text-[11px] text-[#8b95a7]">{o.duration_s}s</p>}
            {o.status !== 'PUBLISHED' ? (
              <button onClick={() => advance(o)} className="cineos-btn-ghost mt-3 w-full !py-1.5 text-[11.5px]">
                <Send size={11} /> {o.status === 'NOT_STARTED' ? 'Bắt đầu' : o.status === 'REVIEW' ? 'Duyệt' : 'Chuyển tiếp'}
              </button>
            ) : (
              <p className="mt-3 text-center font-mono text-[10.5px] text-[#55d79b]">✓ ĐÃ XUẤT BẢN</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================ EDITING ROOM ================================= */

export interface EditClip {
  id: string;
  shot_code: string;
  duration_s: number;
  dialogue: string;
  sound: string;
}

const EDIT_TRACKS = ['VIDEO', 'DIALOGUE', 'MUSIC', 'SFX', 'SUBTITLE'] as const;

const TRACK_TONE: Record<string, string> = {
  VIDEO: 'bg-[#8a78ff]/70 border-[#8a78ff]',
  DIALOGUE: 'bg-[#62a0ff]/70 border-[#62a0ff]',
  MUSIC: 'bg-[#55d79b]/60 border-[#55d79b]',
  SFX: 'bg-[#f0bb62]/60 border-[#f0bb62]',
  SUBTITLE: 'bg-[#8b95a7]/50 border-[#8b95a7]',
};

export function EditingRoom({ clips }: { clips: EditClip[] }) {
  const total = clips.reduce((s, c) => s + c.duration_s, 0);
  let acc = 0;
  const laid = clips.map((c) => {
    const start = acc;
    acc += c.duration_s;
    return { ...c, start, pct: (c.duration_s / (total || 1)) * 100 };
  });

  return (
    <div>
      <div className="cineos-card mb-4 flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8a78ff]/15 text-[#a99dff]">
          <Video size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-white">Rough cut — Assembly</p>
          <p className="text-[11.5px] text-[#8b95a7]">Ghép clip từ shot đã duyệt theo thứ tự scene. Xuất animatic cùng rough mix audio.</p>
        </div>
        <span className="font-mono text-[11px] text-[#8b95a7]">{clips.length} clips · {total}s</span>
      </div>

      <div className="cineos-panel space-y-2 p-4">
        <div className="mb-1 flex justify-between font-mono text-[9.5px] text-[#4a5568]">
          <span>00:00</span><span>{Math.floor(total / 2)}s</span><span>{total}s</span>
        </div>
        {EDIT_TRACKS.map((track) => (
          <div key={track} className="flex items-center gap-3">
            <span className="w-16 shrink-0 font-mono text-[9.5px] font-bold tracking-[0.12em] text-[#8b95a7]">{track}</span>
            <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-[#090c11]">
              {track === 'VIDEO' && laid.map((c) => (
                <div
                  key={c.id}
                  title={`${c.shot_code} · ${c.duration_s}s`}
                  className="absolute inset-y-0 flex items-center justify-center overflow-hidden border-l border-[#0f131a] px-1"
                  style={{ left: `${(c.start / (total || 1)) * 100}%`, width: `${c.pct}%`, background: 'linear-gradient(135deg, rgba(138,120,255,.75), rgba(98,160,255,.55))' }}
                >
                  <span className="truncate font-mono text-[9px] font-bold text-white">{c.shot_code}</span>
                </div>
              ))}
              {track === 'DIALOGUE' && laid.filter((c) => c.dialogue).map((c) => (
                <div key={c.id} title={c.dialogue} className={`absolute inset-y-1 flex items-center rounded px-1 ${TRACK_TONE.DIALOGUE}`}
                  style={{ left: `${(c.start / (total || 1)) * 100}%`, width: `${c.pct}%` }}>
                  <span className="truncate font-mono text-[8.5px] text-white">{c.dialogue ? '✓' : ''}</span>
                </div>
              ))}
              {track === 'MUSIC' && (
                <>
                  <div className={`absolute inset-y-1 left-0 flex items-center rounded px-2 ${TRACK_TONE.MUSIC}`} style={{ width: '40%' }}>
                    <span className="truncate font-mono text-[8.5px] text-white">Explorer Main Theme</span>
                  </div>
                  <div className={`absolute inset-y-1 rounded px-2 ${TRACK_TONE.MUSIC}`} style={{ left: '42%', width: '35%' }}>
                    <span className="truncate font-mono text-[8.5px] text-white">Mission Build</span>
                  </div>
                  <div className={`absolute inset-y-1 rounded px-2 ${TRACK_TONE.MUSIC}`} style={{ left: '80%', width: '18%' }}>
                    <span className="truncate font-mono text-[8.5px] text-white">Swell</span>
                  </div>
                </>
              )}
              {track === 'SFX' && laid.filter((c) => c.sound).map((c) => (
                <div key={c.id} title={c.sound} className={`absolute inset-y-1 flex items-center justify-center rounded ${TRACK_TONE.SFX}`}
                  style={{ left: `${(c.start / (total || 1)) * 100}%`, width: `${Math.max(c.pct, 4)}%` }}>
                  <span className="font-mono text-[8.5px] text-white">●</span>
                </div>
              ))}
              {track === 'SUBTITLE' && laid.map((c) => (
                <div key={c.id} className={`absolute inset-y-2 rounded ${TRACK_TONE.SUBTITLE}`}
                  style={{ left: `${(c.start / (total || 1)) * 100}%`, width: `calc(${c.pct}% - 2px)` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] text-[#4a5568]">
        MVP: assembly + rough cut. Xuất EDL/XML khi cần mở tiếp trong Premiere/Resolve.
      </p>
    </div>
  );
}

/* ================================== ANALYTICS ================================== */

export interface AnalyticsInput {
  shots: { id: string; duration_s: number }[];
  takes: { id: string; shot_id: string; status: string; cost: number }[];
  jobsProd: { id: string; status: string; cost: number }[];
  costEvents: { id: string; category: string; amount: number }[];
}

export function Analytics({ shots, takes, jobsProd, costEvents }: AnalyticsInput) {
  const [group, setGroup] = useState<'PRODUCTION' | 'RELEASE'>('PRODUCTION');

  const stats = useMemo(() => {
    const approvedTakes = takes.filter((t) => t.status === 'APPROVED').length;
    const qcFlags = takes.filter((t) => t.status === 'REJECTED').length;
    const failed = jobsProd.filter((j) => j.status === 'FAILED').length;
    const totalTakes = takes.length || 1;
    const totalCost = costEvents.reduce((s, c) => s + c.amount, 0) + takes.reduce((s, t) => s + t.cost, 0);
    const totalMin = shots.reduce((s, x) => s + x.duration_s, 0) / 60 || 1;
    return [
      ['Average takes / shot', (takes.length / (shots.length || 1)).toFixed(1)],
      ['Approval rate', `${Math.round((approvedTakes / totalTakes) * 100)}%`],
      ['Cost / shot', `$${(totalCost / (shots.length || 1)).toFixed(2)}`],
      ['Cost / minute', `$${(totalCost / totalMin).toFixed(2)}`],
      ['Generation failures', String(failed)],
      ['QC errors (rejected takes)', String(qcFlags)],
    ] as const;
  }, [shots, takes, jobsProd, costEvents]);

  const releaseStats = useMemo(
    () => [
      ['Outputs published', 'Track ở Release Studio'],
      ['Trailer views', 'Chờ kết nối platform API'],
      ['CTR thumbnail', 'Chờ kết nối platform API'],
      ['Watch time', 'Chờ kết nối platform API'],
    ] as const,
    []
  );

  return (
    <div>
      <div className="mb-4 flex gap-1.5">
        {(['PRODUCTION', 'RELEASE'] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] font-bold transition-colors ${
              group === g ? 'border-[#8a78ff]/50 bg-[#8a78ff]/15 text-[#a99dff]' : 'border-[#242c3a] bg-[#151a23] text-[#8b95a7] hover:text-white'
            }`}
          >
            {g} ANALYTICS
          </button>
        ))}
      </div>
      {group === 'PRODUCTION' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map(([label, value]) => (
            <div key={label} className="cineos-card p-4">
              <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#8b95a7]">{label}</p>
              <p className="text-xl font-extrabold ai-text">{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {releaseStats.map(([label, value]) => (
            <div key={label} className="cineos-card p-4">
              <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#8b95a7]">{label}</p>
              <p className="text-[13px] font-bold text-gray-200">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
