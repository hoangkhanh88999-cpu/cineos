import { DollarSign, Settings2 } from 'lucide-react';
import type { CostEvent, Project } from '@/lib/types';
import { SectionTitle, EmptyState, ProgressBar } from '@/components/ui';

export const MONTHLY_BUDGET = 100;

export function CostCenter({ project, costEvents }: { project: Project | null; costEvents: CostEvent[] }) {
  const events = project ? costEvents.filter((c) => c.project_id === project.id) : costEvents;
  const spent = events.reduce((s, c) => s + c.amount, 0);
  const budget = project?.budget_note ? MONTHLY_BUDGET : MONTHLY_BUDGET;
  const pct = Math.min(100, Math.round((spent / budget) * 100));
  const forecast = spent * 1.7;

  if (events.length === 0) {
    return <EmptyState icon={DollarSign} title="Chưa có chi phí nào được ghi nhận" hint="Mọi AI call sẽ được log tại đây" />;
  }

  const cats = ['VIDEO', 'IMAGE', 'LLM', 'VOICE', 'OTHER'];
  const catTotal = cats
    .map((c) => ({ c, sum: events.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0) }))
    .filter((x) => x.sum > 0);

  return (
    <div className="min-h-0 space-y-5 overflow-y-auto pr-1">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="cineos-card p-4">
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-[#8b95a7]">Spent</p>
          <p className={`mt-1 text-2xl font-extrabold ${pct > 80 ? 'text-[#ff6d75]' : 'text-white'}`}>${spent.toFixed(2)}</p>
        </div>
        <div className="cineos-card p-4">
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-[#8b95a7]">Budget</p>
          <p className="mt-1 text-2xl font-extrabold text-white">${budget}</p>
          <ProgressBar value={pct} className="mt-2" />
        </div>
        <div className="cineos-card p-4">
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-[#8b95a7]">Forecast</p>
          <p className={`mt-1 text-2xl font-extrabold ${forecast > budget ? 'text-[#f0bb62]' : 'text-[#55d79b]'}`}>${forecast.toFixed(2)}</p>
        </div>
      </div>

      <section>
        <SectionTitle>Breakdown</SectionTitle>
        <div className="cineos-card divide-y divide-[#1b2130]">
          {catTotal.map(({ c, sum }) => {
            const p = Math.round((sum / spent) * 100);
            return (
              <div key={c} className="flex items-center gap-3 px-4 py-3">
                <span className="w-16 font-mono text-[11px] text-[#8b95a7]">{c}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1b2130]">
                  <div className="ai-accent h-full rounded-full" style={{ width: `${p}%` }} />
                </div>
                <span className="w-16 text-right font-mono text-[12px] text-gray-200">${sum.toFixed(2)}</span>
                <span className="w-9 text-right font-mono text-[11px] text-[#8b95a7]">{p}%</span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle>Cost Log</SectionTitle>
        <div className="cineos-card divide-y divide-[#1b2130]">
          {events.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-14 shrink-0 font-mono text-[10.5px] text-[#a99dff]">{e.category}</span>
              <p className="min-w-0 flex-1 truncate text-[12.5px] text-gray-300">{e.note}</p>
              <span className="shrink-0 font-mono text-[12px] font-semibold text-gray-100">${e.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ProjectSettings({ project }: { project: Project | null }) {
  return (
    <div className="min-h-0 overflow-y-auto pr-1">
      <SectionTitle>Project Settings</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ['Format', project?.format ?? '—'],
          ['Genre', project?.genre ?? '—'],
          ['Tone', project?.tone ?? '—'],
          ['Audience', project?.audience ?? '—'],
          ['Distribution', project?.distribution ?? '—'],
          ['Budget note', project?.budget_note ?? '—'],
          ['References', project?.references_note ?? '—'],
          ['Constraints', project?.constraints_note ?? '—'],
        ].map(([k, v]) => (
          <div key={k} className="cineos-card p-4">
            <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">
              <Settings2 size={10} /> {k}
            </p>
            <p className="text-[13px] leading-relaxed text-gray-300">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 cineos-card p-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">AI Providers</p>
        <p className="text-[13px] leading-relaxed text-[#8b95a7]">
          Model registry + provider router (AUTO / MANUAL / PROJECT DEFAULT / SHOT OVERRIDE) sẽ cấu hình tại đây — dữ liệu production không bị khóa vào một provider.
        </p>
      </div>
    </div>
  );
}
