import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, LayoutDashboard, BookOpen, Users, MapPin, Tv, Bot, CheckCircle2,
  ListChecks, DollarSign, Settings, GitBranch, Palette, Camera, FileText,
  Blocks, Film, LayoutGrid, ShieldCheck, Link2, Star, Layers, Zap, Clock,
  FolderOpen, Music, Mic, Send, BarChart3, Video, Lightbulb, FlaskConical, Shirt, Mountain, Clapperboard, Cpu,
} from 'lucide-react';
import type { Project, Task, Character, CharacterRelationship, LocationNode, Prop, Episode, Agent, Approval, GenerationJob, CostEvent } from '@/lib/types';
import type { Scene, StoryboardFrame, Shot, Take, GenerationJobProd, MasterPrompt } from '@/lib/production';
import type { StyleCandidate, CinePreset } from '@/pages/StyleLab';
import { StatusBadge, Pipeline, SectionTitle } from '@/components/ui';
import { CharacterStudio, RelationshipGraph } from '@/pages/CharacterStudio';
import { WorldStudio } from '@/pages/WorldStudio';
import { EpisodeManager, WritersRoom } from '@/pages/EpisodesPages';
import { AgentControlCenter, ApprovalCenter, TaskCenter } from '@/pages/ManagePages';
import { CostCenter, ProjectSettings } from '@/pages/ProjectModules';
import {
  ScreenplayEditor, SceneBuilder, Storyboard, ShotDesigner, PromptEngine,
  GenerationManager, ProductionBoard, QcCenter, ContinuityEngine, TakeManager,
} from '@/pages/ProductionModules';
import { VisualStyleLab, CinematographyBible, Timeline } from '@/pages/StyleLab';
import { AssetLibrary, MusicSound, VoiceStudio, ReleaseStudio, Analytics, EditingRoom } from '@/pages/StudioModules';
import { IdeaLab, ResearchRoom, CostumeStudio, EnvironmentStudio, Animatic, ModelRouter } from '@/pages/DevModules';
import type { Idea, ResearchTopic, Costume, Environment, ModelEntry } from '@/pages/DevModules';
import type { Asset, ReleaseOutput, VoiceProfile } from '@/pages/StudioModules';

type WorkspaceView =
  | 'overview' | 'characters' | 'relationships' | 'world' | 'episodes' | 'writers'
  | 'agents' | 'approvals' | 'tasks' | 'costs' | 'settings'
  | 'timeline' | 'style' | 'cine' | 'screenplay' | 'scenes' | 'storyboard'
  | 'shots' | 'prompts' | 'generations' | 'board' | 'qc' | 'continuity' | 'takes'
  | 'assets' | 'music' | 'voice' | 'release' | 'analytics' | 'editing'
  | 'idea' | 'research' | 'costume' | 'environment' | 'animatic' | 'router';

const NAV_GROUPS: { group: string; items: { key: WorkspaceView; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    group: 'OVERVIEW',
    items: [{ key: 'overview', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    group: 'DESIGN',
    items: [
      { key: 'idea', label: 'Idea Lab', icon: Lightbulb },
      { key: 'research', label: 'Research Room', icon: FlaskConical },
      { key: 'characters', label: 'Characters', icon: Users },
      { key: 'costume', label: 'Costume Studio', icon: Shirt },
      { key: 'relationships', label: 'Relationships', icon: GitBranch },
      { key: 'world', label: 'World & Props', icon: MapPin },
      { key: 'environment', label: 'Environment Studio', icon: Mountain },
      { key: 'style', label: 'Visual Style Lab', icon: Palette },
      { key: 'cine', label: 'Cinematography', icon: Camera },
    ],
  },
  {
    group: 'WRITE',
    items: [
      { key: 'episodes', label: 'Episodes', icon: Tv },
      { key: 'writers', label: "Writers' Room", icon: BookOpen },
      { key: 'timeline', label: 'Timeline', icon: Clock },
      { key: 'screenplay', label: 'Screenplay', icon: FileText },
      { key: 'scenes', label: 'Scenes', icon: Blocks },
    ],
  },
  {
    group: 'PRODUCE',
    items: [
      { key: 'storyboard', label: 'Storyboard', icon: Film },
      { key: 'animatic', label: 'Animatic', icon: Clapperboard },
      { key: 'router', label: 'AI Model Router', icon: Cpu },
      { key: 'shots', label: 'Shot Designer', icon: LayoutGrid },
      { key: 'takes', label: 'Take Manager', icon: Star },
      { key: 'prompts', label: 'Prompt Engine', icon: Layers },
      { key: 'generations', label: 'Generation Queue', icon: Zap },
      { key: 'board', label: 'Production Board', icon: LayoutGrid },
      { key: 'qc', label: 'QC Center', icon: ShieldCheck },
      { key: 'continuity', label: 'Continuity', icon: Link2 },
      { key: 'assets', label: 'Asset Library', icon: FolderOpen },
    ],
  },
  {
    group: 'POST',
    items: [
      { key: 'editing', label: 'Editing Room', icon: Video },
      { key: 'music', label: 'Music & Sound', icon: Music },
      { key: 'voice', label: 'Voice Studio', icon: Mic },
      { key: 'release', label: 'Release Studio', icon: Send },
      { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    group: 'MANAGE',
    items: [
      { key: 'approvals', label: 'Approvals', icon: CheckCircle2 },
      { key: 'tasks', label: 'Tasks', icon: ListChecks },
      { key: 'agents', label: 'Agents', icon: Bot },
      { key: 'costs', label: 'Costs', icon: DollarSign },
      { key: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function ProjectWorkspace({
  projects,
  tasks,
  characters,
  relationships,
  locations,
  props,
  episodes,
  agents,
  approvals,
  generationJobs,
  costEvents,
  onApproveDecide,
  scenes,
  frames,
  shots,
  takes,
  jobsProd,
  prompts,
  styleCandidates,
  cinePresets,
  assets,
  releaseOutputs,
  voiceProfiles,
  ideas,
  researchTopics,
  costumes,
  environments,
  models,
}: {
  ideas: Idea[];
  researchTopics: ResearchTopic[];
  costumes: Costume[];
  environments: Environment[];
  models: ModelEntry[];
  assets: Asset[];
  releaseOutputs: ReleaseOutput[];
  voiceProfiles: VoiceProfile[];
  scenes: Scene[];
  frames: StoryboardFrame[];
  shots: Shot[];
  takes: Take[];
  jobsProd: GenerationJobProd[];
  prompts: MasterPrompt[];
  styleCandidates: StyleCandidate[];
  cinePresets: CinePreset[];
  projects: Project[];
  tasks: Task[];
  characters: Character[];
  relationships: CharacterRelationship[];
  locations: LocationNode[];
  props: Prop[];
  episodes: Episode[];
  agents: Agent[];
  approvals: Approval[];
  generationJobs: GenerationJob[];
  costEvents: CostEvent[];
  onApproveDecide: (id: string, status: 'APPROVED' | 'REJECTED' | 'REVISION') => void;
}) {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const project = projects.find((p) => p.id === id);
  const [view, setView] = useState<WorkspaceView>('overview');

  if (!project) {
    return <div className="flex h-full items-center justify-center text-sm text-[#8b95a7]">Không tìm thấy project.</div>;
  }

  const scoped = <T extends { project_id: string | null }>(arr: T[]) => arr.filter((x) => x.project_id === project.id) as T[];
  const pCharacters = scoped(characters);
  const pRelationships = scoped(relationships);
  const pLocations = scoped(locations);
  const pProps = scoped(props);
  const pEpisodes = scoped(episodes).sort((a, b) => a.number - b.number);
  const pApprovals = scoped(approvals);
  const pTasks = scoped<Task>(tasks);
  const pGenerations = scoped(generationJobs);
  const pCosts = scoped(costEvents);
  const pScenes = scoped(scenes).sort((a, b) => a.scene_number - b.scene_number);
  const pFrames = scoped(frames).sort((a, b) => a.frame_number - b.frame_number);
  const pShots = scoped(shots).sort((a, b) => a.shot_code.localeCompare(b.shot_code));
  const pTakes = scoped(takes).sort((a, b) => a.take_number - b.take_number);
  const pJobsProd = scoped(jobsProd);
  const pPrompts = scoped(prompts);
  const pStyleCandidates = scoped(styleCandidates);
  const pCinePresets = scoped(cinePresets);
  const pAssets = scoped(assets);
  const pReleases = scoped(releaseOutputs);
  const pVoiceProfiles = scoped(voiceProfiles);
  const pIdeas = scoped(ideas);
  const pResearch = scoped(researchTopics);
  const pCostumes = scoped(costumes);
  const pEnvironments = scoped(environments);
  const pModels = scoped(models);
  const [prodTick, setProdTick] = useState(0);
  const loadProd = () => setProdTick((t) => t + 1);

  const brief = project.brief;

  return (
    <div className="flex h-full min-h-0">
      {/* Workspace sidebar */}
      <nav className="hidden w-48 shrink-0 flex-col overflow-y-auto border-r border-[#242c3a] bg-[#0f131a] p-2 xl:flex">
        <button onClick={() => nav('/projects')} className="mb-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium text-[#8b95a7] transition-colors hover:bg-[#1b2130] hover:text-white">
          <ArrowLeft size={13} /> Projects
        </button>
        <p className="mb-2 truncate px-2 text-[12.5px] font-extrabold text-white">{project.name}</p>
        {NAV_GROUPS.map((g) => (
          <div key={g.group} className="mb-2">
            <p className="px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#4a5568]">{g.group}</p>
            {g.items.map((item) => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={`relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition-all ${
                  view === item.key ? 'bg-[#8a78ff]/15 text-[#a99dff]' : 'text-[#8b95a7] hover:bg-[#1b2130] hover:text-white'
                }`}
              >
                {view === item.key && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[#8a78ff]" />}
                <item.icon size={14} />
                {item.label}
                {item.key === 'approvals' && pApprovals.filter((a) => a.status === 'PENDING').length > 0 && (
                  <span className="ml-auto flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#f0bb62]/20 px-1 font-mono text-[9px] font-bold text-[#f0bb62]">
                    {pApprovals.filter((a) => a.status === 'PENDING').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Mobile view switcher */}
      <div className="fixed bottom-16 left-1/2 z-20 flex -translate-x-1/2 gap-1 rounded-xl border border-[#242c3a] bg-[#0f131a]/95 p-1 backdrop-blur xl:hidden">
        {(['overview', 'scenes', 'board', 'approvals'] as WorkspaceView[]).map((k) => (
          <button
            key={k}
            onClick={() => setView(k)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${view === k ? 'bg-[#8a78ff]/20 text-[#a99dff]' : 'text-[#8b95a7]'}`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Main */}
      <main className="min-w-0 flex-1 overflow-y-auto px-6 py-6">
        {view === 'overview' && (
          <div className="fade-up mx-auto max-w-4xl">
            <div className="mb-6 flex flex-wrap items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-extrabold tracking-tight text-white">{project.name}</h1>
                  <StatusBadge status={project.status} />
                </div>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#8b95a7]">{project.logline ?? project.idea}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[project.format, project.genre, project.tone, project.audience, project.distribution].filter(Boolean).map((tag) => (
                    <span key={tag} className="cineos-chip">{tag}</span>
                  ))}
                </div>
              </div>
              <span className="font-mono text-lg font-bold text-[#a99dff]">{project.progress}%</span>
            </div>

            <div className="cineos-card mb-6 p-5">
              <Pipeline status={project.status} />
            </div>

            {/* Production pipeline per department */}
            <section className="mb-6">
              <SectionTitle>Production Progress</SectionTitle>
              <div className="cineos-card space-y-3 p-4">
                {[
                  ['Development', project.status !== 'IDEA' ? 90 : 20],
                  ['Story / Script', project.status === 'IDEA' ? 0 : project.status === 'SCRIPT_DEVELOPMENT' ? 60 : project.status >= 'SCRIPT_LOCK' ? 100 : 40],
                  ['Characters', pCharacters.length > 0 ? Math.round((pCharacters.filter((c) => c.status === 'APPROVED' || c.status === 'LOCKED').length / pCharacters.length) * 100) : 0],
                  ['Episodes', pEpisodes.length > 0 ? Math.round(pEpisodes.reduce((s, e) => s + e.script_progress, 0) / pEpisodes.length) : 0],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 text-[12.5px] text-[#8b95a7]">{label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1b2130]">
                      <div className="ai-accent h-full rounded-full transition-all duration-700" style={{ width: `${val as number}%` }} />
                    </div>
                    <span className="w-9 text-right font-mono text-[11px] text-gray-300">{val as number}%</span>
                  </div>
                ))}
              </div>
            </section>

            {brief && (
              <section className="mb-6">
                <SectionTitle>Project Brief v1</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  {([
                    ['Premise', brief.premise],
                    ['Core conflict', brief.coreConflict],
                    ['Emotional promise', brief.emotionalPromise],
                    ['Unique value', brief.uniqueValue],
                  ] as const).map(([k, v]) =>
                    v ? (
                      <div key={k} className="cineos-card p-4">
                        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">{k}</p>
                        <p className="text-[13px] leading-relaxed text-gray-300">{v}</p>
                      </div>
                    ) : null
                  )}
                </div>
                {brief.rules && brief.rules.length > 0 && (
                  <div className="cineos-card mt-3 p-4">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a99dff]">Creative rules</p>
                    <ul className="space-y-1.5">
                      {brief.rules.map((r) => (
                        <li key={r} className="flex gap-2 text-[13px] text-gray-300">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#8a78ff]" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            <section>
              <SectionTitle>Jump to</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {pApprovals.filter((a) => a.status === 'PENDING').length > 0 && (
                  <button onClick={() => setView('approvals')} className="cineos-btn-ghost !py-2 text-[12.5px] !border-[#f0bb62]/40 !text-[#f0bb62]">
                    {pApprovals.filter((a) => a.status === 'PENDING').length} approval chờ duyệt
                  </button>
                )}
                <button onClick={() => setView('episodes')} className="cineos-btn-ghost !py-2 text-[12.5px]">
                  {pEpisodes.length} episodes
                </button>
                <button onClick={() => setView('characters')} className="cineos-btn-ghost !py-2 text-[12.5px]">
                  {pCharacters.length} characters
                </button>
                <button onClick={() => setView('costs')} className="cineos-btn-ghost !py-2 text-[12.5px]">
                  ${pCosts.reduce((s, c) => s + c.amount, 0).toFixed(2)} spent
                </button>
              </div>
            </section>
          </div>
        )}

        {view === 'characters' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4">
              <SectionTitle right={<Link to="#" className="text-[12px] font-semibold text-[#a99dff]">Costume Studio → sau</Link>}>Character Studio</SectionTitle>
            </div>
            <div className="h-[calc(100%-3rem)] min-h-[400px]">
              <CharacterStudio characters={pCharacters} relationships={pRelationships} />
            </div>
          </div>
        )}

        {view === 'relationships' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4">
              <SectionTitle>Relationship Graph</SectionTitle>
            </div>
            <div className="h-[calc(100%-3rem)] min-h-[400px]">
              <RelationshipGraph characters={pCharacters} relationships={pRelationships} />
            </div>
          </div>
        )}

        {view === 'world' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4">
              <SectionTitle>World & Prop Library</SectionTitle>
            </div>
            <div className="h-[calc(100%-3rem)] min-h-[400px]">
              <WorldStudio locations={pLocations} props={pProps} />
            </div>
          </div>
        )}

        {view === 'episodes' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4">
              <SectionTitle>Episode Manager</SectionTitle>
            </div>
            <div className="h-[calc(100%-3rem)] min-h-[400px]">
              <EpisodeManager episodes={pEpisodes} />
            </div>
          </div>
        )}

        {view === 'writers' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4">
              <SectionTitle>AI Writers' Room</SectionTitle>
            </div>
            <div className="h-[calc(100%-3rem)] min-h-[400px]">
              <WritersRoom agents={agents} />
            </div>
          </div>
        )}

        {view === 'agents' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4">
              <SectionTitle>Agent Control Center</SectionTitle>
            </div>
            <AgentControlCenter agents={agents} />
          </div>
        )}

        {view === 'approvals' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4">
              <SectionTitle>Approval Center</SectionTitle>
            </div>
            <ApprovalCenter approvals={pApprovals} onDecide={onApproveDecide} />
          </div>
        )}

        {view === 'tasks' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4">
              <SectionTitle>Task Center</SectionTitle>
            </div>
            <TaskCenter tasks={pTasks} />
          </div>
        )}

        {view === 'costs' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4">
              <SectionTitle>Cost Center</SectionTitle>
            </div>
            <CostCenter project={project} costEvents={costEvents} />
          </div>
        )}

        {view === 'timeline' && (
          <div className="fade-up mx-auto max-w-4xl">
            <div className="mb-4"><SectionTitle>Timeline</SectionTitle></div>
            <Timeline episodes={pEpisodes} shots={pShots} />
          </div>
        )}

        {view === 'style' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4"><SectionTitle>Visual Style Lab</SectionTitle></div>
            <div className="h-[calc(100%-3rem)] min-h-[400px]">
              <VisualStyleLab candidates={pStyleCandidates} project={project} onChanged={loadProd} />
            </div>
          </div>
        )}

        {view === 'cine' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4"><SectionTitle>Cinematography Bible</SectionTitle></div>
            <div className="h-[calc(100%-3rem)] min-h-[400px]">
              <CinematographyBible presets={pCinePresets} />
            </div>
          </div>
        )}

        {view === 'screenplay' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4"><SectionTitle>Screenplay Editor</SectionTitle></div>
            <div className="h-[calc(100%-3rem)] min-h-[420px]">
              <ScreenplayEditor
                scenes={pScenes}
                episodeTitle={pScenes[0] ? pEpisodes.find((e) => e.id === pScenes[0].episode_id)?.title ?? null : null}
              />
            </div>
          </div>
        )}

        {view === 'scenes' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4"><SectionTitle>Scene Builder</SectionTitle></div>
            <div className="h-[calc(100%-3rem)] min-h-[420px]">
              <SceneBuilder
                scenes={pScenes}
                episodes={pEpisodes}
                characters={pCharacters}
                locations={pLocations}
                props={pProps}
                onChanged={loadProd}
              />
            </div>
          </div>
        )}

        {view === 'storyboard' && (
          <div className="fade-up flex h-full min-h-0 flex-col">
            <div className="mb-4"><SectionTitle>Storyboard</SectionTitle></div>
            <Storyboard frames={pFrames} scenes={pScenes} onChanged={loadProd} />
          </div>
        )}

        {view === 'shots' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4"><SectionTitle>Shot Designer</SectionTitle></div>
            <div className="h-[calc(100%-3rem)] min-h-[440px]">
              <ShotDesigner
                shots={pShots}
                scenes={pScenes}
                characters={pCharacters}
                props={pProps}
                prompts={pPrompts}
                takes={pTakes}
                onChanged={loadProd}
              />
            </div>
          </div>
        )}

        {view === 'takes' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>Take Manager</SectionTitle></div>
            <TakeManager takes={pTakes} shots={pShots} onChanged={loadProd} />
          </div>
        )}

        {view === 'prompts' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4"><SectionTitle>Prompt Engine</SectionTitle></div>
            <div className="h-[calc(100%-3rem)] min-h-[420px]">
              <PromptEngine shots={pShots} prompts={pPrompts} onChanged={loadProd} />
            </div>
          </div>
        )}

        {view === 'generations' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>Generation Manager</SectionTitle></div>
            <GenerationManager jobs={pJobsProd} takes={pTakes} shots={pShots} onChanged={loadProd} />
          </div>
        )}

        {view === 'board' && (
          <div className="fade-up flex h-full min-h-0 flex-col">
            <div className="mb-4"><SectionTitle>Production Board</SectionTitle></div>
            <ProductionBoard shots={pShots} onChanged={loadProd} />
          </div>
        )}

        {view === 'qc' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>QC Center</SectionTitle></div>
            <QcCenter takes={pTakes} onChanged={loadProd} />
          </div>
        )}

        {view === 'continuity' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>Continuity Engine</SectionTitle></div>
            <ContinuityEngine shots={pShots} />
          </div>
        )}

        {view === 'assets' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4"><SectionTitle>Asset Library</SectionTitle></div>
            <div className="h-[calc(100%-3rem)] min-h-[420px]">
              <AssetLibrary assets={pAssets} onChanged={loadProd} />
            </div>
          </div>
        )}

        {view === 'editing' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>Editing Room</SectionTitle></div>
            <EditingRoom
              clips={[...pShots]
                .sort((a, b) => a.shot_code.localeCompare(b.shot_code))
                .map((s) => ({ id: s.id, shot_code: s.shot_code, duration_s: s.duration_s, dialogue: s.dialogue ?? '', sound: s.sound ?? '' }))}
            />
          </div>
        )}

        {view === 'music' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>Music & Sound</SectionTitle></div>
            <MusicSound />
          </div>
        )}

        {view === 'voice' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>Voice Studio</SectionTitle></div>
            <VoiceStudio
              profiles={pVoiceProfiles}
              characterNames={Object.fromEntries(pCharacters.map((c) => [c.id, c.name]))}
              onChanged={loadProd}
            />
          </div>
        )}

        {view === 'release' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>Release Studio</SectionTitle></div>
            <ReleaseStudio outputs={pReleases} onChanged={loadProd} />
          </div>
        )}

        {view === 'analytics' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>Analytics</SectionTitle></div>
            <Analytics shots={pShots} takes={pTakes} jobsProd={pJobsProd} costEvents={pCosts} />
          </div>
        )}

        {view === 'idea' && (
          <div className="fade-up flex min-h-[420px] flex-col">
            <div className="mb-4"><SectionTitle>Idea Lab</SectionTitle></div>
            <IdeaLab ideas={pIdeas} onChanged={loadProd} />
          </div>
        )}

        {view === 'research' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>Research Room</SectionTitle></div>
            <ResearchRoom topics={pResearch} onChanged={loadProd} />
          </div>
        )}

        {view === 'costume' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>Costume Studio</SectionTitle></div>
            <CostumeStudio
              costumes={pCostumes}
              characterNames={Object.fromEntries(pCharacters.map((c) => [c.id, c.name]))}
              onChanged={loadProd}
            />
          </div>
        )}

        {view === 'environment' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>Environment Studio</SectionTitle></div>
            <EnvironmentStudio
              environments={pEnvironments}
              locationNames={Object.fromEntries(pLocations.map((l) => [l.id, l.name]))}
              onChanged={loadProd}
            />
          </div>
        )}

        {view === 'animatic' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>Animatic</SectionTitle></div>
            <Animatic
              frames={pFrames}
              sceneNames={Object.fromEntries(pScenes.map((s) => [s.id, `SC${String(s.scene_number).padStart(2, '0')} — ${s.slug}`]))}
              musicCues={['Explorer Main Theme', 'Mission Build', 'Payoff Swell']}
            />
          </div>
        )}

        {view === 'router' && (
          <div className="fade-up">
            <div className="mb-4"><SectionTitle>AI Model Router</SectionTitle></div>
            <ModelRouter models={pModels} />
          </div>
        )}

        {view === 'settings' && (
          <div className="fade-up h-full min-h-0">
            <div className="mb-4">
              <SectionTitle>Settings</SectionTitle>
            </div>
            <ProjectSettings project={project} />
          </div>
        )}
      </main>
    </div>
  );
}
