import { useNavigate } from 'react-router-dom';
import { Clapperboard, Plus, FolderOpen } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Project } from '@/lib/types';
import { StatusBadge, ProgressBar, EmptyState } from '@/components/ui';

const FILTERS = ['All', 'Development', 'Production', 'Post-production', 'Released', 'Archived'] as const;

function matchesFilter(p: Project, f: (typeof FILTERS)[number]) {
  if (f === 'All') return true;
  if (f === 'Development') return ['IDEA', 'DEVELOPMENT', 'GREENLIGHT', 'SCRIPT_DEVELOPMENT', 'SCRIPT_LOCK'].includes(p.status);
  if (f === 'Production') return ['PRE_PRODUCTION', 'VISUAL_LOCK', 'PRODUCTION'].includes(p.status);
  if (f === 'Post-production') return ['POST_PRODUCTION', 'FINAL_QC', 'MASTER_LOCK'].includes(p.status);
  if (f === 'Released') return p.status === 'RELEASED' || p.status === 'MARKETING';
  return p.status === 'ARCHIVED';
}

export function ProjectsPage({ projects }: { projects: Project[] }) {
  const nav = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const list = useMemo(() => projects.filter((p) => matchesFilter(p, filter)), [projects, filter]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="fade-up mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">{projects.length} productions in this studio</p>
        </div>
        <button onClick={() => nav('/new')} className="cineos-btn-primary !py-2 text-[13px]">
          <Plus size={15} strokeWidth={2.6} /> New Project
        </button>
      </div>

      <div className="fade-up mb-5 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
              filter === f ? 'bg-gradient-to-r from-[#8a78ff] to-[#5e9dff] text-white' : 'border border-[#242c3a] text-[#8b95a7] hover:border-[#303a4b] hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Không có project ở mục này" hint="Chọn filter khác hoặc tạo project mới" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((p) => (
            <button
              key={p.id}
              onClick={() => nav(`/project/${p.id}`)}
              className="cineos-card fade-up group flex flex-col p-4 text-left transition-all duration-200 hover:border-[#8a78ff]/40 hover:shadow-[0_0_30px_rgba(138,120,255,0.08)]"
            >
              <div className="mb-3 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#1f242c] to-[#12151a] ring-1 ring-white/10 transition-transform group-hover:scale-105">
                  <Clapperboard size={18} className="text-[#a99dff]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{p.name}</p>
                  <p className="text-[11px] text-gray-500">{p.format ?? 'Unspecified format'}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              {p.logline && <p className="mb-3 line-clamp-2 text-[12.5px] leading-relaxed text-gray-400">{p.logline}</p>}
              <div className="mt-auto flex items-center gap-3">
                <ProgressBar value={p.progress} />
                <span className="shrink-0 font-mono text-[11px] text-gray-500">{p.progress}%</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
