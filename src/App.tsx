import { useCallback, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { TopBar, LeftNav } from '@/components/Shell';
import { NovaPanel } from '@/components/NovaPanel';
import { StudioHome } from '@/pages/StudioHome';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { NewProjectWizard } from '@/pages/NewProjectWizard';
import { ProjectWorkspace } from '@/pages/ProjectWorkspace';
import { supabase } from '@/lib/supabase';
import type { Project, Task, Activity, NovaMessage, Agent, Character, CharacterRelationship, LocationNode, Prop, Episode, Approval, GenerationJob, CostEvent } from '@/lib/types';
import type { Scene, StoryboardFrame, Shot, Take, GenerationJobProd, MasterPrompt } from '@/lib/production';
import type { StyleCandidate, CinePreset } from '@/pages/StyleLab';
import type { Asset, ReleaseOutput, VoiceProfile } from '@/pages/StudioModules';
import type { Idea, ResearchTopic, Costume, Environment, ModelEntry } from '@/pages/DevModules';
import { Zap, Bot, ListChecks, CircleDot, DollarSign } from 'lucide-react';

function novaAutoReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('tình hình') || t.includes('studio') || t.includes('progress'))
    return 'Studio đang ổn định: Project 001 chạy ở Script Development. Điểm nghẽn hiện tại là Character Design — duyệt Ba (Hùng) v02 sẽ mở khóa Visual Development.';
  if (t.includes('duyệt') || t.includes('approve'))
    return 'Có 2 approval đang chờ: Character Ba v02 (P1) và Visual Style candidates (P2). Anh duyệt trong Approval Center của project nhé.';
  if (t.includes('chi') || t.includes('cost') || t.includes('budget'))
    return 'Tuần này chi $1.61 — chủ yếu là video generation. Budget còn dư nhiều, chưa cần guardrail.';
  if (t.includes('tạo') || t.includes('new'))
    return 'Bấm New Project ở thanh trên nhé — wizard 9 bước sẽ biến ý tưởng thô thành Project Brief trong vài phút.';
  return 'Em đã ghi nhận. Anh muốn xem pipeline, duyệt approval, hay bắt đầu project mới?';
}

interface StudioData {
  projects: Project[];
  tasks: Task[];
  activity: Activity[];
  nova: NovaMessage[];
  agents: Agent[];
  characters: Character[];
  relationships: CharacterRelationship[];
  locations: LocationNode[];
  props: Prop[];
  episodes: Episode[];
  approvals: Approval[];
  generationJobs: GenerationJob[];
  costEvents: CostEvent[];
  scenes: Scene[];
  frames: StoryboardFrame[];
  shots: Shot[];
  takes: Take[];
  jobsProd: GenerationJobProd[];
  prompts: MasterPrompt[];
  styleCandidates: StyleCandidate[];
  cinePresets: CinePreset[];
  assets: Asset[];
  releaseOutputs: ReleaseOutput[];
  voiceProfiles: VoiceProfile[];
  ideas: Idea[];
  researchTopics: ResearchTopic[];
  costumes: Costume[];
  environments: Environment[];
  models: ModelEntry[];
}

const EMPTY: StudioData = {
  projects: [], tasks: [], activity: [], nova: [], agents: [], characters: [],
  relationships: [], locations: [], props: [], episodes: [], approvals: [],
  generationJobs: [], costEvents: [], scenes: [], frames: [], shots: [], takes: [],
  jobsProd: [], prompts: [], styleCandidates: [], cinePresets: [], assets: [], releaseOutputs: [], voiceProfiles: [], ideas: [], researchTopics: [], costumes: [], environments: [], models: [],
};

function AppInner() {
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [data, setData] = useState<StudioData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, t, a, n, ag, ch, cr, lo, pr, ep, ap, gj, ce, sc, sb, sh, tk, jp, mp, stl, cp, as, ro, vp, ide, rs, cs, en, mr] = await Promise.all([
      supabase.from('projects').select('*').order('updated_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('activity').select('*').order('created_at', { ascending: false }),
      supabase.from('nova_messages').select('*').order('created_at', { ascending: true }),
      supabase.from('agents').select('*'),
      supabase.from('characters').select('*').order('code'),
      supabase.from('character_relationships').select('*'),
      supabase.from('locations').select('*').order('created_at'),
      supabase.from('props').select('*').order('code'),
      supabase.from('episodes').select('*').order('number'),
      supabase.from('approvals').select('*').order('created_at', { ascending: false }),
      supabase.from('generation_jobs').select('*').order('created_at', { ascending: false }),
      supabase.from('cost_events').select('*').order('created_at', { ascending: false }),
      supabase.from('scenes').select('*').order('scene_number'),
      supabase.from('storyboard_frames').select('*').order('frame_number'),
      supabase.from('shots').select('*').order('shot_code'),
      supabase.from('takes').select('*').order('take_number'),
      supabase.from('generation_jobs_prod').select('*').order('queued_at', { ascending: false }),
      supabase.from('master_prompts').select('*'),
      supabase.from('style_candidates').select('*').order('name'),
      supabase.from('cinematography_presets').select('*').order('name'),
      supabase.from('assets').select('*').order('created_at'),
      supabase.from('release_outputs').select('*').order('kind'),
      supabase.from('voice_profiles').select('*').order('created_at'),
      supabase.from('ideas').select('*').order('created_at'),
      supabase.from('research_topics').select('*').order('created_at'),
      supabase.from('costumes').select('*').order('slot'),
      supabase.from('environments').select('*').order('created_at'),
      supabase.from('model_registry').select('*').order('type'),
    ]);
    const err = [p, t, a, n, ag, ch, cr, lo, pr, ep, ap, gj, ce, sc, sb, sh, tk, jp, mp, stl, cp, as, ro, vp, ide, rs, cs, en, mr].find((r) => r.error);
    if (err) {
      setDbError('Không kết nối được database.');
    } else {
      setData({
        projects: p.data ?? [],
        tasks: t.data ?? [],
        activity: a.data ?? [],
        nova: n.data ?? [],
        agents: ag.data ?? [],
        characters: ch.data ?? [],
        relationships: cr.data ?? [],
        locations: lo.data ?? [],
        props: pr.data ?? [],
        episodes: ep.data ?? [],
        approvals: ap.data ?? [],
        generationJobs: gj.data ?? [],
        costEvents: ce.data ?? [],
        scenes: sc.data ?? [],
        frames: sb.data ?? [],
        shots: sh.data ?? [],
        takes: tk.data ?? [],
        jobsProd: jp.data ?? [],
        prompts: mp.data ?? [],
        styleCandidates: stl.data ?? [],
        cinePresets: cp.data ?? [],
        assets: as.data ?? [],
        releaseOutputs: ro.data ?? [],
        voiceProfiles: vp.data ?? [],
        ideas: ide.data ?? [],
        researchTopics: rs.data ?? [],
        costumes: cs.data ?? [],
        environments: en.data ?? [],
        models: mr.data ?? [],
      });
      setDbError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sendGlobalNova = async (text: string) => {
    const { data: um, error: ue } = await supabase
      .from('nova_messages').insert({ project_id: null, role: 'user', content: text }).select().single();
    if (!ue && um) setData((d) => ({ ...d, nova: [...d.nova, um as NovaMessage] }));
    setTimeout(async () => {
      const { data: rm, error: re } = await supabase
        .from('nova_messages').insert({ project_id: null, role: 'nova', content: novaAutoReply(text) }).select().single();
      if (!re && rm) setData((d) => ({ ...d, nova: [...d.nova, rm as NovaMessage] }));
    }, 800);
  };

  const decideApproval = async (id: string, status: 'APPROVED' | 'REJECTED' | 'REVISION') => {
    setData((d) => ({ ...d, approvals: d.approvals.map((a) => (a.id === id ? { ...a, status } : a)) }));
    await supabase.from('approvals').update({ status }).eq('id', id);
    const appr = data.approvals.find((a) => a.id === id);
    if (appr) {
      await supabase.from('activity').insert({
        project_id: appr.project_id,
        kind: status === 'APPROVED' ? 'approve' : 'info',
        message: `${appr.title} — ${status === 'APPROVED' ? 'được duyệt' : status === 'REVISION' ? 'yêu cầu chỉnh sửa' : 'bị từ chối'} bởi Film Owner`,
      });
    }
    load();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="relative">
          <span className="nova-pulse block h-12 w-12 rounded-full bg-gradient-to-br from-[#8a78ff] to-[#5e9dff]" />
          <span className="nova-orbit absolute inset-[-8px] rounded-full border border-dashed border-[#8a78ff]/40" />
        </div>
      </div>
    );
  }

  const activeCount = data.projects.filter((p) => p.status !== 'ARCHIVED' && p.status !== 'RELEASED').length;
  const runningGens = data.generationJobs.filter((g) => g.status === 'RUNNING' || g.status === 'QC').length;
  const workingAgents = data.agents.filter((a) => a.state === 'WORKING' || a.state === 'THINKING' || a.state === 'REVIEWING').length;
  const todaySpend = data.costEvents.reduce((s, c) => s + c.amount, 0);
  const blocked = data.tasks.filter((t) => t.status === 'BLOCKED').length;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar
        onNavigate={(r) => nav(r.view === 'project' ? `/project/${r.id}` : r.view === 'wizard' ? '/new' : r.view === 'projects' ? '/projects' : '/')}
        onNewProject={() => nav('/new')}
      />
      {dbError && <div className="border-b border-[#ff6d75]/20 bg-[#ff6d75]/10 px-6 py-2 text-center text-[12px] text-[#ff6d75]">{dbError}</div>}

      <div className="flex min-h-0 flex-1">
        <LeftNav
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onNavigate={(r) => nav(r.view === 'project' ? `/project/${r.id}` : r.view === 'wizard' ? '/new' : r.view === 'projects' ? '/projects' : '/')}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-hidden">
            <Routes>
              <Route
                path="/"
                element={
                  <div className="h-full overflow-y-auto">
                    <StudioHome
                      projects={data.projects}
                      tasks={data.tasks}
                      activity={data.activity}
                      agents={data.agents}
                      approvals={data.approvals}
                      generationJobs={data.generationJobs}
                      costEvents={data.costEvents}
                    />
                  </div>
                }
              />
              <Route
                path="/projects"
                element={
                  <div className="h-full overflow-y-auto">
                    <ProjectsPage projects={data.projects} />
                  </div>
                }
              />
              <Route
                path="/new"
                element={
                  <div className="h-full overflow-y-auto">
                    <NewProjectWizard onCreated={load} />
                  </div>
                }
              />
              <Route
                path="/project/:id"
                element={
                  <ProjectWorkspace
                    projects={data.projects}
                    tasks={data.tasks}
                    characters={data.characters}
                    relationships={data.relationships}
                    locations={data.locations}
                    props={data.props}
                    episodes={data.episodes}
                    agents={data.agents}
                    approvals={data.approvals}
                    generationJobs={data.generationJobs}
                    costEvents={data.costEvents}
                    onApproveDecide={decideApproval}
                    scenes={data.scenes}
                    frames={data.frames}
                    shots={data.shots}
                    takes={data.takes}
                    jobsProd={data.jobsProd}
                    prompts={data.prompts}
                    styleCandidates={data.styleCandidates}
                    cinePresets={data.cinePresets}
                    assets={data.assets}
                    releaseOutputs={data.releaseOutputs}
                    voiceProfiles={data.voiceProfiles}
                    ideas={data.ideas}
                    researchTopics={data.researchTopics}
                    costumes={data.costumes}
                    environments={data.environments}
                    models={data.models}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Bottom status rail */}
          <footer className="flex h-9 shrink-0 items-center gap-4 border-t border-[#242c3a] bg-[#0f131a] px-4 font-mono text-[10.5px] text-[#8b95a7]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#55d79b]" /> System healthy
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <Bot size={11} /> {workingAgents} agents active
            </span>
            <span className="hidden items-center gap-1.5 md:flex">
              <Zap size={11} /> {runningGens} generations
            </span>
            <span className="hidden items-center gap-1.5 lg:flex">
              <ListChecks size={11} /> {blocked} blocked
            </span>
            <span className="hidden items-center gap-1.5 lg:flex">
              <DollarSign size={11} /> ${todaySpend.toFixed(2)} this month
            </span>
            <span className="ml-auto hidden items-center gap-1.5 xl:flex">
              <CircleDot size={11} /> {activeCount} active productions
            </span>
          </footer>
        </div>

        <NovaPanel projectId={null} messages={data.nova.filter((m) => !m.project_id)} onSend={sendGlobalNova} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppInner />
    </HashRouter>
  );
}
