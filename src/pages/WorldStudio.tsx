import { useState } from 'react';
import { MapPin, Package, Building2 } from 'lucide-react';
import type { LocationNode, Prop } from '@/lib/types';
import { SectionTitle, EmptyState } from '@/components/ui';

export function WorldStudio({ locations, props }: { locations: LocationNode[]; props: Prop[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(locations[0]?.id ?? null);
  const selected = locations.find((l) => l.id === selectedId) ?? null;
  const roots = locations.filter((l) => !l.parent_id);
  const childrenOf = (id: string) => locations.filter((l) => l.parent_id === id);

  if (locations.length === 0) {
    return <EmptyState icon={MapPin} title="World chưa được xây" hint="Environment Designer sẽ dựng world tree sau khi duyệt Bible" />;
  }

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[280px_1fr]">
      {/* World tree */}
      <div className="cineos-panel min-h-0 overflow-y-auto p-3">
        <p className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b95a7]">World Tree</p>
        {roots.map((root) => (
          <div key={root.id} className="mb-2">
            <button
              onClick={() => setSelectedId(root.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-bold transition-all ${
                selectedId === root.id ? 'bg-[#8a78ff]/15 text-[#a99dff]' : 'text-gray-200 hover:bg-[#1b2130]'
              }`}
            >
              <Building2 size={14} className="shrink-0 text-[#8a78ff]" />
              {root.name}
            </button>
            <div className="ml-4 border-l border-[#242c3a] pl-2">
              {childrenOf(root.id).map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedId(child.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition-all ${
                    selectedId === child.id ? 'bg-[#8a78ff]/15 text-[#a99dff]' : 'text-[#8b95a7] hover:bg-[#1b2130] hover:text-white'
                  }`}
                >
                  <span className="h-1 w-1 shrink-0 rounded-full bg-[#4a5568]" />
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Environment detail */}
      <div className="cineos-panel min-h-0 overflow-y-auto p-5">
        {selected ? (
          <>
            <div className="mb-4 flex h-32 items-center justify-center rounded-xl border border-[#242c3a] bg-gradient-to-br from-[#5e9dff]/10 via-[#151a23] to-[#8a78ff]/10">
              <p className="font-mono text-[10.5px] text-[#8b95a7]">Environment master visual — sẽ render tại đây</p>
            </div>
            <h3 className="text-lg font-extrabold text-white">{selected.name}</h3>
            {selected.description && <p className="mt-1 text-[13.5px] leading-relaxed text-gray-300">{selected.description}</p>}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {selected.palette && (
                <div className="cineos-card p-3">
                  <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">Palette</p>
                  <p className="text-[13px] text-gray-300">{selected.palette}</p>
                </div>
              )}
              {selected.lighting && (
                <div className="cineos-card p-3">
                  <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">Lighting</p>
                  <p className="text-[13px] text-gray-300">{selected.lighting}</p>
                </div>
              )}
            </div>
            <div className="mt-5">
              <SectionTitle>Props in this world</SectionTitle>
              <div className="grid gap-2 sm:grid-cols-2">
                {props.map((prop) => (
                  <div key={prop.id} className="cineos-card flex items-start gap-3 p-3">
                    <Package size={15} className="mt-0.5 shrink-0 text-[#f0bb62]" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-gray-100">{prop.name}</p>
                      <p className="truncate font-mono text-[10.5px] text-[#8b95a7]">{prop.code}</p>
                      <p className="mt-0.5 text-[11.5px] text-[#8b95a7]">
                        {prop.owner_character && `${prop.owner_character} · `}
                        {prop.location} · {prop.condition}
                      </p>
                      {prop.notes && <p className="mt-0.5 text-[12px] text-gray-400">{prop.notes}</p>}
                    </div>
                  </div>
                ))}
                {props.length === 0 && <p className="text-[13px] text-[#8b95a7]">Chưa có prop nào.</p>}
              </div>
            </div>
          </>
        ) : (
          <EmptyState icon={MapPin} title="Chọn một location" />
        )}
      </div>
    </div>
  );
}
