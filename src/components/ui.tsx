import type { ProjectStatus } from '@/lib/types';
import { PIPELINE, STATUS_TONE } from '@/lib/types';
import { Film } from 'lucide-react';

const TONE_CLASS: Record<string, string> = {
  neutral: 'bg-[#1b2130] text-[#8b95a7] border-[#303a4b]',
  info: 'bg-[#62a0ff]/10 text-[#62a0ff] border-[#62a0ff]/25',
  active: 'bg-[#8a78ff]/10 text-[#a99dff] border-[#8a78ff]/25',
  warn: 'bg-[#f0bb62]/10 text-[#f0bb62] border-[#f0bb62]/25',
  success: 'bg-[#55d79b]/10 text-[#55d79b] border-[#55d79b]/25',
};

const DOT_CLASS: Record<string, string> = {
  neutral: 'bg-[#8b95a7]',
  info: 'bg-[#62a0ff]',
  active: 'bg-[#8a78ff]',
  warn: 'bg-[#f0bb62]',
  success: 'bg-[#55d79b]',
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const tone = STATUS_TONE[status] ?? 'neutral';
  const label = PIPELINE.find((p) => p.key === status)?.label ?? status;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TONE_CLASS[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[tone]}`} />
      {label}
    </span>
  );
}

export function Pipeline({ status }: { status: ProjectStatus }) {
  const idx = PIPELINE.findIndex((p) => p.key === status);
  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <div
          className="ai-accent absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-all duration-700"
          style={{ width: `${(Math.max(idx, 0) / (PIPELINE.length - 1)) * 100}%` }}
        />
        {PIPELINE.map((p, i) => {
          const done = i <= idx;
          const current = i === idx;
          return (
            <div key={p.key} className="relative z-10 flex flex-col items-center" title={p.label}>
              <span
                className={`h-2.5 w-2.5 rounded-full border-2 transition-all ${
                  current
                    ? 'h-3.5 w-3.5 border-[#a99dff] bg-[#8a78ff] shadow-[0_0_12px_rgba(138,120,255,0.7)]'
                    : done
                      ? 'border-[#8a78ff] bg-[#8a78ff]/80'
                      : 'border-[#303a4b] bg-[#151a23]'
                }`}
              />
              <span className={`mt-2 hidden text-[10px] font-medium lg:block ${current ? 'text-[#a99dff]' : 'text-[#4a5568]'}`}>
                {p.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
      <div
        className="ai-accent h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8b95a7]">{children}</h2>
      {right}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint }: { icon: typeof Film; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#242c3a] py-10 text-center">
      <Icon size={28} className="mb-3 text-[#4a5568]" />
      <p className="text-sm font-medium text-[#8b95a7]">{title}</p>
      {hint && <p className="mt-1 text-xs text-[#4a5568]">{hint}</p>}
    </div>
  );
}
