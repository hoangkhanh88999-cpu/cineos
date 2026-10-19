import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clapperboard, Zap, ChevronRight, CircleCheck, Bot } from 'lucide-react';
import type { Project, Task, Activity, Agent, Approval, GenerationJob, CostEvent } from '@/lib/types';
import { AGENT_STATE_STYLE } from '@/lib/types';
import { StatusBadge, ProgressBar, Pipeline, SectionTitle, EmptyState } from '@/components/ui';

export type StudioHealth = 'GOOD' | 'ATTENTION' | 'CRITICAL';

const HEALTH_STYLE: Record<StudioHealth, { dot: string; text: string }> = {
  GOOD: { dot: 'bg-[#55d79b]', text: 'text-[#55d79b]' },
  ATTENTION: { dot: 'bg-[#f0bb62] status-blink', text: 'text-[#f0bb62]' },
  CRITICAL: { dot: 'bg-[#ff6d75] status-blink', text: 'text-[#ff6d75]' },
};

const PRIORITY_DOT: Record<string, string> = {
  P0: 'bg-[#ff6d75]',
  P1: 'bg-[#f0bb62]',
  P2: 'bg-[#62a0ff]',
  P3: 'bg-[#8b95a7]',
};

function relative(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function StudioHome({
  projects,
  tasks,
  activity,
  agents,
  approvals,
  generationJobs,
  costEvents,
}: {
  projects: Project[];
  tasks: Task[];
  activity: Activity[];
  agents: Agent[];
  approvals: Approval[];
  generationJobs: GenerationJob[];
  costEvents: CostEvent[];
}) {
  const nav = useNavigate();
  const active = projects.filter((p) => p.status !== 'ARCHIVED' && p.status !== 'RELEASED');
  const hero = active[0];

  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED');
  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
  const highPriority = tasks.filter((t) => t.priority === 'HIGH' && t.status !== 'DONE');
  const runningGens = generationJobs.filter((g) => g.status === 'RUNNING' || g.status === 'QC');
  const failedGens = generationJobs.filter((g) => g.status === 'FAILED');

  const attentionCount = blockedTasks.length + pendingApprovals.length + failedGens.length;
  const health: StudioHealth = attentionCount === 0 ? 'GOOD' : attentionCount <= 3 ? 'ATTENTION' : 'CRITICAL';

  const monthSpend = costEvents.reduce((s, c) => s + c.amount, 0);
  const BUDGET = 100;
  const budgetPct = Math.min(100, Math.round((monthSpend / BUDGET) * 100));

  const attentionItems = [
    ...pendingApprovals.map((a) => ({
      id: a.id,
      kind: 'APPROVAL',
      priority: a.priority,
      title: a.title,
      meta: `${a.kind} · waiting for you`,
      projectId: a.project_id,
    })),
    ...blockedTasks.map((t) => ({
      id: t.id,
      kind: 'BLOCKED',
      priority: t.priority === 'HIGH' ? 'P1' : 'P2',
      title: t.title,
      meta: `${t.agent ?? 'Agent'} blocked`,
      projectId: t.project_id,
    })),
    ...failedGens.map((g) => ({
      id: g.id,
      kind: 'GENERATION FAILURE',
      priority: 'P1',
      title: g.code,
      meta: `${g.type} · ${g.model} failed`,
      projectId: g.project_id,
    })),
    ...highPriority.filter((t) => t.status === 'TODO').map((t) => ({
      id: t.id,
      kind: 'DECISION',
      priority: 'P2',
      title: t.title,
      meta: `${t.agent ?? 'Studio'} · ${t.department ?? 'General'}`,
      projectId: t.project_id,
    })),
  ].slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-6 py-8">
      {/* Hero + health */}
      <section className="fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#8b95a7]">STUDIO HQ</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Chào anh,</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-[#8b95a7]">
            <span className={`inline-block h-2 w-2 rounded-full ${HEALTH_STYLE[health].dot}`} />
            <span className={`font-semibold ${HEALTH_STYLE[health].text}`}>Studio Health: {health}</span>
            <span className="text-[#4a5568]">·</span>
            {active.length} active productions · {attentionCount} cần xử lý
          </p>
        </div>
        {hero && (
          <button onClick={() => nav(`/project/${hero.id}`)} className="cineos-btn-ghost !py-2 text-[13px]">
            Resume {hero.name} <ChevronRight size={14} />
          </button>
        )}
      </section>

      {/* Needs attention */}
      <section className="fade-up">
        <SectionTitle right={attentionItems.length > 0 ? <span className="cineos-chip !border-[#f0bb62]/30 !text-[#f0bb62]">{attentionItems.length} items</span> : undefined}>
          Needs Your Attention
        </SectionTitle>
        {attentionItems.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-[#55d79b]/20 bg-[#55d79b]/5 p-4">
            <CircleCheck size={18} className="text-[#55d79b]" />
            <div>
              <p className="text-sm font-semibold text-[#55d79b]">Everything is moving.</p>
              <p className="text-[12px] text-[#8b95a7]">Nothing currently needs your attention. NOVA sẽ báo khi có quyết định mới.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {attentionItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.projectId && nav(`/project/${item.projectId}`)}
                className="cineos-card group flex w-full items-center gap-3 p-3.5 text-left transition-all hover:border-[#8a78ff]/40"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[item.priority] ?? 'bg-[#8b95a7]'}`} />
                <span className="w-32 shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-[#8b95a7]">{item.kind}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-gray-100">{item.title}</p>
                  <p className="truncate text-[11px] text-[#8b95a7]">{item.meta}</p>
                </div>
                <ChevronRight size={15} className="shrink-0 text-[#4a5568] transition-colors group-hover:text-[#a99dff]" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Active projects */}
      <section className="fade-up">
        <SectionTitle
          right={
            <button onClick={() => nav('/projects')} className="text-[12px] font-semibold text-[#a99dff] hover:text-[#8a78ff]">
              View all
            </button>
          }
        >
          Active Projects
        </SectionTitle>
        {active.length === 0 ? (
          <EmptyState icon={Clapperboard} title="Chưa có project nào" hint="Tạo project đầu tiên để khởi động studio" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((p) => (
              <button
                key={p.id}
                onClick={() => nav(`/project/${p.id}`)}
                className="cineos-card w-full p-4 text-left transition-all hover:border-[#8a78ff]/40"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#8a78ff]/25 to-[#5e9dff]/15 ring-1 ring-[#8a78ff]/30">
                    <Clapperboard size={17} className="text-[#a99dff]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-white">{p.name}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="truncate text-[12px] text-[#8b95a7]">{p.logline ?? p.idea ?? p.format}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[12px] text-[#8b95a7]">{p.progress}%</span>
                </div>
                <Pipeline status={p.status} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* AI Crew + Generations + Cost */}
      <div className="fade-up grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-1">
          <SectionTitle>AI Crew</SectionTitle>
          <div className="cineos-card divide-y divide-[#1b2130]">
            {agents.slice(0, 6).map((a) => {
              const st = AGENT_STATE_STYLE[a.state] ?? AGENT_STATE_STYLE.IDLE;
              return (
                <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold"
                    style={{ backgroundColor: `${a.accent}1f`, color: a.accent }}
                  >
                    {a.name.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-gray-100">
                      {a.name} <span className="font-medium text-[#8b95a7]">· {a.role}</span>
                    </p>
                    {a.context_note && <p className="truncate text-[11px] text-[#8b95a7]">{a.context_note}</p>}
                  </div>
                  <span className={`flex shrink-0 items-center gap-1.5 text-[10.5px] font-semibold ${st.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </div>
              );
            })}
            {agents.length === 0 && <div className="p-4"><EmptyState icon={Bot} title="Chưa có agent nào" /></div>}
          </div>
        </section>

        <section className="lg:col-span-1">
          <SectionTitle right={<span className="cineos-chip">{runningGens.length} running</span>}>Generation Queue</SectionTitle>
          <div className="cineos-card divide-y divide-[#1b2130]">
            {generationJobs.length === 0 && <div className="p-4"><EmptyState icon={Zap} title="Queue trống" /></div>}
            {generationJobs.slice(0, 6).map((g) => {
              const statusStyle: Record<string, string> = {
                QUEUED: 'text-[#8b95a7]',
                RUNNING: 'text-[#62a0ff]',
                QC: 'text-[#f0bb62]',
                COMPLETED: 'text-[#55d79b]',
                FAILED: 'text-[#ff6d75]',
              };
              return (
                <div key={g.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-gray-200">{g.code}</p>
                    <span className={`text-[11px] font-semibold ${statusStyle[g.status] ?? 'text-[#8b95a7]'}`}>{g.status}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10.5px] text-[#8b95a7]">{g.type} · {g.model}</span>
                    {g.progress != null && g.status === 'RUNNING' && <ProgressBar value={g.progress} className="!h-1 flex-1" />}
                    <span className="ml-auto font-mono text-[10.5px] text-[#8b95a7]">${g.cost.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-1">
          <SectionTitle>Cost Snapshot</SectionTitle>
          <div className="cineos-card p-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#8b95a7]">This month</p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className={`text-2xl font-extrabold ${budgetPct > 80 ? 'text-[#ff6d75]' : budgetPct > 60 ? 'text-[#f0bb62]' : 'text-white'}`}>
                ${monthSpend.toFixed(2)}
              </p>
              <p className="text-[12px] text-[#8b95a7]">/ ${BUDGET}</p>
            </div>
            <ProgressBar value={budgetPct} className="mt-3" />
            <div className="mt-4 space-y-2">
              {['VIDEO', 'IMAGE', 'LLM'].map((cat) => {
                const sum = costEvents.filter((c) => c.category === cat).reduce((s, c) => s + c.amount, 0);
                const pct = monthSpend > 0 ? Math.round((sum / monthSpend) * 100) : 0;
                if (sum === 0) return null;
                return (
                  <div key={cat} className="flex items-center gap-2 text-[12px]">
                    <span className="w-14 text-[#8b95a7]">{cat}</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#1b2130]">
                      <div className="ai-accent h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-9 text-right font-mono text-[11px] text-gray-300">{pct}%</span>
                  </div>
                );
              })}
            </div>
            {budgetPct > 80 && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#ff6d75]/10 p-2.5 text-[11.5px] font-semibold text-[#ff6d75]">
                <AlertTriangle size={13} /> Budget guardrail — cần anh duyệt thêm chi tiêu
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Activity */}
      <section className="fade-up">
        <SectionTitle>Studio Activity</SectionTitle>
        {activity.length === 0 ? (
          <EmptyState icon={CircleCheck} title="Chưa có hoạt động nào" />
        ) : (
          <div className="cineos-card divide-y divide-[#1b2130]">
            {activity.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    a.kind === 'approve' ? 'bg-[#55d79b]' : a.kind === 'agent' ? 'bg-[#62a0ff]' : 'bg-[#8b95a7]'
                  }`}
                />
                <p className="flex-1 truncate text-[13px] text-gray-300">{a.message}</p>
                <span className="shrink-0 font-mono text-[11px] text-[#8b95a7]">{relative(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
