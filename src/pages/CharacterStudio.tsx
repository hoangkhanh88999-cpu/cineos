import { useState } from 'react';
import { Users, GitBranch, UserRound } from 'lucide-react';
import type { Character, CharacterRelationship } from '@/lib/types';
import { ENTITY_STATUS_STYLE } from '@/lib/types';
import { SectionTitle, EmptyState } from '@/components/ui';

const TABS = ['Overview', 'Story', 'Appearance', 'Voice', 'Relationships'] as const;

export function CharacterStudio({
  characters,
  relationships,
}: {
  characters: Character[];
  relationships: CharacterRelationship[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(characters[0]?.id ?? null);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');
  const selected = characters.find((c) => c.id === selectedId) ?? null;

  if (characters.length === 0) {
    return <EmptyState icon={Users} title="Chưa có nhân vật nào" hint="NOVA sẽ tạo cast sau khi duyệt Project Brief" />;
  }

  const rels = relationships.filter((r) => r.from_character === selectedId || r.to_character === selectedId);
  const other = (r: CharacterRelationship) =>
    characters.find((c) => c.id === (r.from_character === selectedId ? r.to_character : r.from_character));

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[220px_1fr_300px]">
      {/* Left list */}
      <div className="cineos-panel flex min-h-0 flex-col p-2">
        <p className="px-2 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b95a7]">Cast · {characters.length}</p>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {characters.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full rounded-lg px-3 py-2.5 text-left transition-all ${
                c.id === selectedId ? 'bg-[#8a78ff]/15 ring-1 ring-[#8a78ff]/30' : 'hover:bg-[#1b2130]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8a78ff]/30 to-[#5e9dff]/20 text-[11px] font-extrabold text-[#a99dff]">
                  {c.name.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-gray-100">{c.name}</p>
                  <p className="truncate font-mono text-[10px] text-[#8b95a7]">{c.code} · v{c.version}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Center canvas */}
      <div className="cineos-panel flex min-h-0 flex-col p-5">
        {selected ? (
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-white">{selected.name}</h3>
                <p className="text-[12.5px] text-[#8b95a7]">
                  {selected.role} {selected.archetype && `· ${selected.archetype}`}
                </p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10.5px] font-bold ${ENTITY_STATUS_STYLE[selected.status]}`}>
                {selected.status}
              </span>
            </div>

            {/* Visual placeholder — character canvas */}
            <div className="mb-4 flex h-40 items-center justify-center rounded-xl border border-[#242c3a] bg-gradient-to-br from-[#8a78ff]/10 via-[#151a23] to-[#5e9dff]/10">
              <div className="text-center">
                <UserRound size={36} className="mx-auto mb-1 text-[#8a78ff]/60" />
                <p className="font-mono text-[10.5px] text-[#8b95a7]">Visual canvas — keyframe pack sẽ render tại đây</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
                    tab === t ? 'bg-[#8a78ff]/15 text-[#a99dff]' : 'text-[#8b95a7] hover:bg-[#1b2130] hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {tab === 'Overview' && (
                <p className="text-[13.5px] leading-relaxed text-gray-300">{selected.personality}</p>
              )}
              {tab === 'Story' && selected.story && (
                <div className="space-y-2.5">
                  {Object.entries(selected.story).map(([k, v]) => (
                    <div key={k} className="cineos-card p-3">
                      <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">{k}</p>
                      <p className="text-[13px] text-gray-300">{v}</p>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'Appearance' && selected.appearance && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(selected.appearance).map(([k, v]) => (
                    <div key={k} className="cineos-card p-3">
                      <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">{k}</p>
                      <p className="text-[13px] text-gray-300">{v}</p>
                    </div>
                  ))}
                </div>
              )}
              {tab === 'Voice' && (
                <div className="cineos-card p-4 text-[13px] text-[#8b95a7]">
                  Voice profile sẽ được thiết lập trong Voice Studio — pitch, pace, energy, emotion reference.
                </div>
              )}
              {tab === 'Relationships' && (
                <div className="space-y-2">
                  {rels.length === 0 && <p className="text-[13px] text-[#8b95a7]">Chưa có quan hệ nào được ghi nhận.</p>}
                  {rels.map((r) => {
                    const o = other(r);
                    return (
                      <div key={r.id} className="cineos-card flex items-start gap-3 p-3">
                        <GitBranch size={15} className="mt-0.5 shrink-0 text-[#8a78ff]" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-100">
                            {selected.name.split('(')[0].trim()} ↔ {o?.name ?? '?'}
                            <span className="ml-2 font-mono text-[10px] text-[#8b95a7]">strength {r.strength}/5</span>
                          </p>
                          {r.conflict && <p className="mt-0.5 text-[12.5px] text-gray-400">{r.conflict}</p>}
                          {r.history && <p className="mt-0.5 text-[11.5px] text-[#8b95a7]">{r.history}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <EmptyState icon={Users} title="Chọn một nhân vật" />
        )}
      </div>

      {/* Right inspector */}
      <div className="cineos-panel hidden min-h-0 flex-col p-4 lg:flex">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b95a7]">Inspector</p>
        {selected ? (
          <div className="space-y-3 overflow-y-auto">
            <div className="cineos-card p-3">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">AI Identity</p>
              <div className="space-y-1 font-mono text-[11.5px] text-gray-300">
                <p>CHAR_ID: {selected.code}</p>
                <p>Version: v{selected.version}</p>
                <p>Status: {selected.status}</p>
              </div>
            </div>
            <div className="cineos-card p-3">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">Continuity</p>
              <p className="text-[12.5px] text-gray-400">
                Shot reference sẽ flag khi costume / hair / prop lệch trạng thái đã lock.
              </p>
            </div>
            <button className="cineos-btn-ghost w-full !py-2 text-[12.5px]">Request Revision</button>
            {selected.status !== 'LOCKED' && (
              <button className="cineos-btn-primary w-full !py-2 text-[12.5px]">Approve Design</button>
            )}
          </div>
        ) : (
          <EmptyState icon={Users} title="— " />
        )}
      </div>
    </div>
  );
}

export function RelationshipGraph({
  characters,
  relationships,
}: {
  characters: Character[];
  relationships: CharacterRelationship[];
}) {
  const [selected, setSelected] = useState<CharacterRelationship | null>(relationships[0] ?? null);
  if (characters.length === 0) return <EmptyState icon={GitBranch} title="Chưa có dữ liệu quan hệ" />;

  // simple radial layout
  const cx = 50, cy = 46;
  const pos = characters.map((c, i) => {
    const angle = (2 * Math.PI * i) / characters.length - Math.PI / 2;
    return { c, x: cx + 30 * Math.cos(angle), y: cy + 26 * Math.sin(angle) };
  });
  const byId = (id: string) => pos.find((p) => p.c.id === id);

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1fr_320px]">
      <div className="cineos-panel relative min-h-0 p-4">
        <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          {relationships.map((r) => {
            const a = byId(r.from_character);
            const b = byId(r.to_character);
            if (!a || !b) return null;
            const isSel = selected?.id === r.id;
            return (
              <g key={r.id} onClick={() => setSelected(r)} className="cursor-pointer">
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isSel ? '#8a78ff' : '#303a4b'} strokeWidth={isSel ? 0.6 : 0.35} />
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 1} fill={isSel ? '#a99dff' : '#8b95a7'} fontSize="2.2" textAnchor="middle">
                  {r.type}
                </text>
              </g>
            );
          })}
          {pos.map(({ c, x, y }) => (
            <g key={c.id}>
              <circle cx={x} cy={y} r={4.5} fill="#1b2130" stroke="#8a78ff" strokeWidth="0.4" />
              <text x={x} y={y + 1.2} fill="#e8eaed" fontSize="3" textAnchor="middle" fontWeight="700">
                {c.name.replace(/\(.*\)/, '').trim().slice(0, 6)}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="cineos-panel min-h-0 overflow-y-auto p-4">
        <SectionTitle>Relationship Detail</SectionTitle>
        {selected ? (
          <div className="space-y-3">
            <div className="cineos-card p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">Type</p>
              <p className="text-[13.5px] font-bold text-white">{selected.type}</p>
              <p className="mt-1 text-[12px] text-[#8b95a7]">Strength {selected.strength}/5</p>
            </div>
            {selected.conflict && (
              <div className="cineos-card p-3">
                <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">Conflict</p>
                <p className="text-[13px] text-gray-300">{selected.conflict}</p>
              </div>
            )}
            {selected.history && (
              <div className="cineos-card p-3">
                <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">History</p>
                <p className="text-[13px] text-gray-300">{selected.history}</p>
              </div>
            )}
            <p className="text-[12px] text-[#8b95a7]">AI Writer đọc relationship state trước khi viết dialogue.</p>
          </div>
        ) : (
          <p className="text-[13px] text-[#8b95a7]">Chọn một đường nối để xem chi tiết.</p>
        )}
      </div>
    </div>
  );
}
