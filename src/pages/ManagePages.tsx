import { useState } from 'react';
import { Bot, CheckCircle2, XCircle, RotateCcw, ListChecks, ShieldAlert } from 'lucide-react';
import type { Agent, Approval, Task } from '@/lib/types';
import { AGENT_STATE_STYLE } from '@/lib/types';
import { SectionTitle, EmptyState } from '@/components/ui';

export function AgentControlCenter({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) return <EmptyState icon={Bot} title="Chưa có agent nào" />;
  return (
    <div className="min-h-0 overflow-y-auto pr-1">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((a) => {
          const st = AGENT_STATE_STYLE[a.state] ?? AGENT_STATE_STYLE.IDLE;
          return (
            <div key={a.id} className="cineos-card p-4 transition-all hover:border-[#8a78ff]/35">
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-[13px] font-extrabold"
                  style={{ backgroundColor: `${a.accent}1f`, color: a.accent }}
                >
                  {a.name.slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-extrabold text-white">{a.name}</p>
                  <p className="text-[12px] text-[#8b95a7]">{a.role}</p>
                </div>
              </div>
              <p className={`mb-1 flex items-center gap-1.5 text-[12px] font-semibold ${st.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} /> {st.label}
              </p>
              {a.context_note && <p className="text-[12.5px] leading-relaxed text-gray-400">{a.context_note}</p>}
              <div className="mt-3 flex gap-1.5">
                <span className="cineos-chip !text-[10px]">{a.department}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ApprovalCenter({
  approvals,
  onDecide,
}: {
  approvals: Approval[];
  onDecide: (id: string, status: 'APPROVED' | 'REJECTED' | 'REVISION') => void;
}) {
  const [tab, setTab] = useState<'PENDING' | 'DECIDED'>('PENDING');
  const list = approvals.filter((a) => (tab === 'PENDING' ? a.status === 'PENDING' : a.status !== 'PENDING'));

  if (approvals.length === 0) {
    return <EmptyState icon={CheckCircle2} title="Không có approval nào" hint="Mọi quyết định quan trọng sẽ tập trung tại đây" />;
  }

  const PRIORITY_DOT: Record<string, string> = { P0: 'bg-[#ff6d75]', P1: 'bg-[#f0bb62]', P2: 'bg-[#62a0ff]', P3: 'bg-[#8b95a7]' };

  return (
    <div className="min-h-0 overflow-y-auto pr-1">
      <div className="mb-4 flex gap-1.5">
        {(['PENDING', 'DECIDED'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
              tab === t ? 'bg-[#8a78ff]/15 text-[#a99dff]' : 'text-[#8b95a7] hover:bg-[#1b2130]'
            }`}
          >
            {t === 'PENDING' ? 'Pending' : 'Decided'}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {list.map((a) => {
          const payload = a.payload as { changes?: string[]; candidates?: string[] } | null;
          return (
            <div key={a.id} className="cineos-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[a.priority] ?? 'bg-[#8b95a7]'}`} />
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8b95a7]">{a.kind}</span>
                <p className="text-[13.5px] font-bold text-white">{a.title}</p>
                <span
                  className={`ml-auto rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                    a.status === 'APPROVED'
                      ? 'border-[#55d79b]/30 text-[#55d79b]'
                      : a.status === 'REJECTED'
                        ? 'border-[#ff6d75]/30 text-[#ff6d75]'
                        : a.status === 'REVISION'
                          ? 'border-[#f0bb62]/30 text-[#f0bb62]'
                          : 'border-[#62a0ff]/30 text-[#62a0ff]'
                  }`}
                >
                  {a.status}
                </span>
              </div>
              {payload?.changes && (
                <ul className="mt-2 space-y-1">
                  {payload.changes.map((c) => (
                    <li key={c} className="flex gap-2 text-[12.5px] text-gray-400">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#8a78ff]" />
                      {c}
                    </li>
                  ))}
                </ul>
              )}
              {payload?.candidates && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {payload.candidates.map((c) => (
                    <span key={c} className="cineos-chip">{c}</span>
                  ))}
                </div>
              )}
              {a.status === 'PENDING' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => onDecide(a.id, 'APPROVED')} className="cineos-btn-primary !px-3.5 !py-1.5 text-[12px]">
                    <CheckCircle2 size={13} /> Approve
                  </button>
                  <button onClick={() => onDecide(a.id, 'REVISION')} className="cineos-btn-ghost !px-3.5 !py-1.5 text-[12px]">
                    <RotateCcw size={13} /> Request Revision
                  </button>
                  <button onClick={() => onDecide(a.id, 'REJECTED')} className="cineos-btn-ghost !px-3.5 !py-1.5 text-[12px] !text-[#ff6d75]">
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && <p className="py-8 text-center text-[13px] text-[#8b95a7]">Không có gì ở mục này.</p>}
      </div>
    </div>
  );
}

export function TaskCenter({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return <EmptyState icon={ListChecks} title="Chưa có task nào" />;
  const STATUS_STYLE: Record<string, string> = {
    DOING: 'border-[#62a0ff]/30 text-[#62a0ff] bg-[#62a0ff]/10',
    TODO: 'border-[#303a4b] text-[#8b95a7] bg-[#1b2130]',
    BLOCKED: 'border-[#ff6d75]/30 text-[#ff6d75] bg-[#ff6d75]/10',
    DONE: 'border-[#55d79b]/30 text-[#55d79b] bg-[#55d79b]/10',
  };
  return (
    <div className="min-h-0 overflow-y-auto pr-1">
      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className="cineos-card flex items-center gap-3 p-3.5">
            {t.status === 'BLOCKED' ? <ShieldAlert size={16} className="shrink-0 text-[#ff6d75]" /> : <ListChecks size={16} className="shrink-0 text-[#62a0ff]" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-gray-100">{t.title}</p>
              <p className="text-[11px] text-[#8b95a7]">{t.agent ?? 'Studio'} · {t.department ?? 'General'}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[t.status] ?? ''}`}>{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
