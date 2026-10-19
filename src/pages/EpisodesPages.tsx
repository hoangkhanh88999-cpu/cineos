import { useState } from 'react';
import { Tv, PenLine, Send } from 'lucide-react';
import type { Episode, Agent } from '@/lib/types';
import { SectionTitle, EmptyState, ProgressBar } from '@/components/ui';

const EP_STATUS: Record<string, { label: string; cls: string }> = {
  IDEA: { label: 'Idea', cls: 'border-[#303a4b] text-[#8b95a7] bg-[#1b2130]' },
  OUTLINE: { label: 'Outline', cls: 'border-[#62a0ff]/30 text-[#62a0ff] bg-[#62a0ff]/10' },
  WRITING: { label: 'Writing', cls: 'border-[#8a78ff]/30 text-[#a99dff] bg-[#8a78ff]/10' },
  REVIEW: { label: 'Script Review', cls: 'border-[#f0bb62]/30 text-[#f0bb62] bg-[#f0bb62]/10' },
  LOCKED: { label: 'Script Lock', cls: 'border-[#55d79b]/30 text-[#55d79b] bg-[#55d79b]/10' },
};

const WRITING_PIPELINE = [
  'Episode Idea', 'Beat Sheet', 'Treatment', 'Scene Outline', 'Draft Screenplay',
  'Dialogue Pass', 'Continuity Pass', 'Script Doctor', 'Human Review', 'SCRIPT LOCK',
];

export function EpisodeManager({ episodes }: { episodes: Episode[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(episodes[0]?.id ?? null);
  const selected = episodes.find((e) => e.id === selectedId) ?? null;

  if (episodes.length === 0) {
    return <EmptyState icon={Tv} title="Chưa có tập nào" hint="Episode Manager sẽ hiện grid các tập sau khi Script Development bắt đầu" />;
  }

  const stageIdx = selected ? Math.min(WRITING_PIPELINE.length - 1, Math.floor((selected.script_progress / 100) * (WRITING_PIPELINE.length - 1))) : 0;

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1fr_340px]">
      {/* Episode grid */}
      <div className="min-h-0 overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {episodes.map((ep) => {
            const st = EP_STATUS[ep.status] ?? EP_STATUS.IDEA;
            return (
              <button
                key={ep.id}
                onClick={() => setSelectedId(ep.id)}
                className={`cineos-card p-4 text-left transition-all hover:border-[#8a78ff]/40 ${
                  ep.id === selectedId ? 'ring-1 ring-[#8a78ff]/40' : ''
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-[#a99dff]">EP{String(ep.number).padStart(2, '0')}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                </div>
                <p className="mb-1 text-[13.5px] font-bold leading-snug text-white">{ep.title}</p>
                <p className="mb-3 line-clamp-2 text-[12px] leading-relaxed text-[#8b95a7]">{ep.logline}</p>
                {ep.theme && <p className="mb-3 line-clamp-1 text-[11.5px] italic text-[#a99dff]/80">“{ep.theme}”</p>}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-14 font-mono text-[10px] text-[#8b95a7]">Script</span>
                    <ProgressBar value={ep.script_progress} className="!h-1" />
                    <span className="w-8 text-right font-mono text-[10px] text-[#8b95a7]">{ep.script_progress}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-14 font-mono text-[10px] text-[#8b95a7]">Prod</span>
                    <ProgressBar value={ep.production_progress} className="!h-1" />
                    <span className="w-8 text-right font-mono text-[10px] text-[#8b95a7]">{ep.production_progress}%</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Episode detail */}
      <div className="cineos-panel min-h-0 overflow-y-auto p-4">
        {selected ? (
          <>
            <p className="font-mono text-[11px] font-bold text-[#a99dff]">EP{String(selected.number).padStart(2, '0')}</p>
            <h3 className="mb-1 text-lg font-extrabold text-white">{selected.title}</h3>
            <p className="mb-4 text-[13px] leading-relaxed text-gray-300">{selected.logline}</p>
            <SectionTitle>Story Engine</SectionTitle>
            <ol className="space-y-1.5">
              {WRITING_PIPELINE.map((s, i) => {
                const done = i < stageIdx;
                const current = i === stageIdx;
                return (
                  <li key={s} className="flex items-center gap-2.5">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                        current ? 'bg-[#8a78ff] text-white' : done ? 'bg-[#55d79b]/20 text-[#55d79b]' : 'border border-[#303a4b] text-[#8b95a7]'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className={`text-[12.5px] ${current ? 'font-bold text-[#a99dff]' : done ? 'text-gray-300' : 'text-[#8b95a7]'}`}>{s}</span>
                    {current && <span className="ml-auto font-mono text-[9.5px] text-[#8a78ff]">● NOW</span>}
                  </li>
                );
              })}
            </ol>
            {selected.character_focus && (
              <div className="mt-4 cineos-card p-3">
                <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">Character focus</p>
                <p className="text-[13px] text-gray-300">{selected.character_focus}</p>
              </div>
            )}
          </>
        ) : (
          <EmptyState icon={Tv} title="Chọn một tập" />
        )}
      </div>
    </div>
  );
}

export function WritersRoom({ agents }: { agents: Agent[] }) {
  const crew = agents.filter((a) => ['INK', 'ARIA', 'GUARD', 'NOVA'].includes(a.name));
  const [note] = useState(
    'Phòng viết đang hoạt động: INK dẫn dắt beat sheet Episode 01 theo đúng công thức 7 bước (Normal Life → Incident → Child Logic → Escalation → Realization → Action → Payoff). GUARD rà continuity với relationship state giữa ba và bé trước khi viết dialogue.'
  );

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1fr_320px]">
      <div className="cineos-panel min-h-0 overflow-y-auto p-5">
        <SectionTitle>Writers' Room — Discussion</SectionTitle>
        <div className="space-y-3">
          <div className="cineos-card p-4">
            <p className="mb-1 flex items-center gap-2 text-[12px] font-bold text-[#a99dff]">
              <PenLine size={12} /> INK — Screenwriter
            </p>
            <p className="text-[13.5px] leading-relaxed text-gray-300">{note}</p>
          </div>
          <div className="cineos-card p-4">
            <p className="mb-1 text-[12px] font-bold text-[#f0bb62]">GUARD — Continuity</p>
            <p className="text-[13.5px] leading-relaxed text-gray-300">
              Rule check: “NO_CHILD_HUMILIATION” — tiếng cười của EP01 đến từ sự bí của ba, không phải từ việc bé bị chê. Đạt.
            </p>
          </div>
          <div className="cineos-card border-[#f0bb62]/25 p-4">
            <p className="mb-1 text-[12px] font-bold text-[#f0bb62]">PENDING HUMAN REVIEW</p>
            <p className="text-[13.5px] leading-relaxed text-gray-300">
              Beat sheet EP01 chờ anh duyệt để chuyển sang Treatment. Duyệt xong sẽ tự động tạo task storyboard.
            </p>
          </div>
        </div>
      </div>
      <div className="cineos-panel min-h-0 overflow-y-auto p-4">
        <SectionTitle>Agents in Room</SectionTitle>
        <div className="space-y-2">
          {crew.map((a) => (
            <div key={a.id} className="cineos-card flex items-center gap-3 p-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold"
                style={{ backgroundColor: `${a.accent}1f`, color: a.accent }}
              >
                {a.name.slice(0, 2)}
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold text-gray-100">{a.name}</p>
                <p className="text-[11px] text-[#8b95a7]">{a.role}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="cineos-btn-primary mt-4 w-full !py-2 text-[12.5px]">
          <Send size={13} /> Approve Beat Sheet
        </button>
      </div>
    </div>
  );
}
