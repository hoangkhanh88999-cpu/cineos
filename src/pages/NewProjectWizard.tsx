import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Loader2, Check, Film, Users, Link2, SlidersHorizontal, ScanSearch, FileCheck, Rocket, Lightbulb } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  emptyWizard, FORMATS, TONES, AUDIENCES, DISTRIBUTIONS,
  buildBrief, deriveBriefFromIdea,
  type WizardData,
} from '@/lib/types';

const STEPS = [
  { n: 1, label: 'Idea', icon: Lightbulb },
  { n: 2, label: 'Format', icon: Film },
  { n: 3, label: 'Direction', icon: Sparkles },
  { n: 4, label: 'Audience', icon: Users },
  { n: 5, label: 'References', icon: Link2 },
  { n: 6, label: 'Constraints', icon: SlidersHorizontal },
  { n: 7, label: 'Analyze', icon: ScanSearch },
  { n: 8, label: 'Review', icon: FileCheck },
  { n: 9, label: 'Create', icon: Rocket },
];

export function NewProjectWizard({ onCreated }: { onCreated: () => void }) {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [w, setW] = useState<WizardData>(emptyWizard);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [approved, setApproved] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof WizardData>(k: K, v: WizardData[K]) => setW((p) => ({ ...p, [k]: v }));

  const canContinue =
    (step === 1 && w.idea.trim().length >= 10) ||
    (step !== 1 && step !== 7 && step !== 8) ||
    (step === 7 && analyzed) ||
    (step === 8 && approved);

  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    // simulated AI analysis pass — deterministic, local
    await new Promise((r) => setTimeout(r, 2200));
    const derived = deriveBriefFromIdea(w.idea);
    setW((p) => ({
      ...p,
      ...derived,
      title: p.title || derived.title || 'Untitled Project',
      premise: p.premise || derived.premise || '',
      coreConflict:
        p.coreConflict ||
        'Nhân vật chính muốn một điều, gia đình/world đặt ra áp lực ngược lại — cả hai cùng học cách nhượng bộ.',
      emotionalPromise: p.emotionalPromise || 'Người xem thấy chính ngôi nhà của mình trên màn hình — và mỉm cười.',
      uniqueValue: p.uniqueValue || 'Câu chuyện được kể từ cả hai phía: đứa trẻ và người lớn, không ai là kẻ xấu.',
    }));
    setAnalyzing(false);
    setAnalyzed(true);
  };

  const createProject = async () => {
    setCreating(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('projects')
      .insert({
        name: w.title.trim() || 'Untitled Project',
        idea: w.idea,
        format: w.format,
        genre: w.genre,
        tone: w.tone,
        audience: w.audience,
        distribution: w.distribution,
        references_note: w.references_note,
        constraints_note: w.constraints_note,
        budget_note: w.budget_note,
        logline: w.logline,
        status: 'DEVELOPMENT',
        progress: 5,
        brief: buildBrief(w),
      })
      .select('id')
      .single();
    if (err || !data) {
      setError('Không tạo được project. Thử lại nhé.');
      setCreating(false);
      return;
    }
    await supabase.from('activity').insert({
      project_id: data.id,
      kind: 'info',
      message: `Project "${w.title}" được khởi tạo từ New Project Wizard`,
    });
    await supabase.from('tasks').insert({
      project_id: data.id,
      title: 'Dựng Project Brief v1 và Initial Bible',
      department: 'Development',
      agent: 'NOVA — Studio Director',
      priority: 'HIGH',
      status: 'DOING',
    });
    onCreated();
    nav(`/project/${data.id}`);
  };

  return (
    <div className="mx-auto flex h-full max-w-6xl gap-6 px-6 py-6">
      {/* Step nav */}
      <nav className="hidden w-52 shrink-0 md:block">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-600">NEW PROJECT</p>
        <ol className="space-y-1">
          {STEPS.map((s) => {
            const done = s.n < step;
            const current = s.n === step;
            return (
              <li key={s.n}>
                <button
                  onClick={() => s.n < step && setStep(s.n)}
                  disabled={s.n > step}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                    current
                      ? 'bg-[#8a78ff]/15 text-[#a99dff]'
                      : done
                        ? 'text-gray-300 hover:bg-white/5'
                        : 'text-gray-600'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                      current
                        ? 'bg-gradient-to-r from-[#8a78ff] to-[#5e9dff] text-white'
                        : done
                          ? 'bg-emerald-400/15 text-emerald-300'
                          : 'border border-white/15'
                    }`}
                  >
                    {done ? <Check size={12} strokeWidth={3} /> : s.n}
                  </span>
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Workspace */}
      <div className="cineos-card flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {step === 1 && (
            <div className="fade-up">
              <h2 className="text-lg font-extrabold text-white">Kể câu chuyện anh muốn tạo.</h2>
              <p className="mt-1 mb-5 text-[13px] text-gray-500">
                Một câu, một đoạn, ghi chú dang dở — đều đủ. Không cần logline hoàn hảo.
              </p>
              <textarea
                value={w.idea}
                onChange={(e) => set('idea', e.target.value)}
                rows={8}
                autoFocus
                placeholder="VD: Một series về cậu bé 5 tuổi và ba mẹ cùng học cách trưởng thành qua những xung đột hàng ngày..."
                className="cineos-input resize-none leading-relaxed"
              />
              <p className="mt-2 text-right font-mono text-[11px] text-gray-600">{w.idea.trim().length} chars</p>
            </div>
          )}

          {step === 2 && (
            <div className="fade-up">
              <h2 className="text-lg font-extrabold text-white">Định dạng production.</h2>
              <p className="mt-1 mb-5 text-[13px] text-gray-500">Cái này quyết định pipeline và đội agent NOVA sẽ chọn.</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => set('format', f)}
                    className={`rounded-lg border px-3.5 py-3 text-[13px] font-semibold transition-all ${
                      w.format === f
                        ? 'border-[#8a78ff] bg-[#8a78ff]/10 text-[#a99dff]'
                        : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="mt-5">
                <label className="cineos-label">Genre (optional)</label>
                <input value={w.genre} onChange={(e) => set('genre', e.target.value)} placeholder="Family / Slice of life..." className="cineos-input" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-up">
              <h2 className="text-lg font-extrabold text-white">Hướng sáng tạo.</h2>
              <p className="mt-1 mb-5 text-[13px] text-gray-500">Tone & cách nhìn hình ảnh — có thể chỉnh sâu sau trong Visual Style Lab.</p>
              <label className="cineos-label">Tone</label>
              <div className="mb-5 flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => set('tone', t)}
                    className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                      w.tone === t ? 'bg-gradient-to-r from-[#8a78ff] to-[#5e9dff] text-white' : 'border border-[#242c3a] text-[#8b95a7] hover:border-[#303a4b]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <label className="cineos-label">Visual direction (optional)</label>
              <textarea
                value={w.visual}
                onChange={(e) => set('visual', e.target.value)}
                rows={3}
                placeholder="3D stylized, Pixar-like, pastel palette, soft lighting..."
                className="cineos-input resize-none"
              />
            </div>
          )}

          {step === 4 && (
            <div className="fade-up">
              <h2 className="text-lg font-extrabold text-white">Khán giả & kênh phát hành.</h2>
              <p className="mt-1 mb-5 text-[13px] text-gray-500">Giúp các agent viết nội dung đúng chiều dài và đúng nhịp.</p>
              <label className="cineos-label">Primary audience</label>
              <div className="mb-5 flex flex-wrap gap-2">
                {AUDIENCES.map((a) => (
                  <button
                    key={a}
                    onClick={() => set('audience', a)}
                    className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                      w.audience === a ? 'bg-gradient-to-r from-[#8a78ff] to-[#5e9dff] text-white' : 'border border-[#242c3a] text-[#8b95a7] hover:border-[#303a4b]'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <label className="cineos-label">Distribution intent</label>
              <div className="flex flex-wrap gap-2">
                {DISTRIBUTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => set('distribution', d)}
                    className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
                      w.distribution === d ? 'bg-gradient-to-r from-[#8a78ff] to-[#5e9dff] text-white' : 'border border-[#242c3a] text-[#8b95a7] hover:border-[#303a4b]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="fade-up">
              <h2 className="text-lg font-extrabold text-white">Tài liệu tham khảo.</h2>
              <p className="mt-1 mb-5 text-[13px] text-gray-500">Dán link hoặc mô tả nguồn cảm hứng. Tải file sẽ hỗ trợ ở bản sau.</p>
              <textarea
                value={w.references_note}
                onChange={(e) => set('references_note', e.target.value)}
                rows={5}
                placeholder="VD: Fanpage journal về hành trình nuôi con 0-6 tuổi; phong cách kể chuyện kiểu Bluey..."
                className="cineos-input resize-none"
              />
            </div>
          )}

          {step === 6 && (
            <div className="fade-up">
              <h2 className="text-lg font-extrabold text-white">Giới hạn sản xuất.</h2>
              <p className="mt-1 mb-5 text-[13px] text-gray-500">Ngân sách, thời gian, đội ngũ — NOVA sẽ tối ưu pipeline theo đây.</p>
              <label className="cineos-label">Budget (optional)</label>
              <input value={w.budget_note} onChange={(e) => set('budget_note', e.target.value)} placeholder="VD: $200/tháng cho generation" className="cineos-input" />
              <label className="cineos-label mt-5">Constraints (optional)</label>
              <textarea
                value={w.constraints_note}
                onChange={(e) => set('constraints_note', e.target.value)}
                rows={3}
                placeholder="VD: mỗi tập 60-90 giây, dọc cho TikTok..."
                className="cineos-input resize-none"
              />
            </div>
          )}

          {step === 7 && (
            <div className="fade-up">
              <h2 className="text-lg font-extrabold text-white">NOVA phân tích ý tưởng.</h2>
              <p className="mt-1 mb-6 text-[13px] text-gray-500">Studio Director cùng các agent sẽ đọc ý tưởng và đề xuất brief đầu tiên.</p>
              {!analyzed && !analyzing && (
                <button onClick={runAnalysis} className="cineos-btn-primary">
                  <Sparkles size={15} /> Run AI Analysis
                </button>
              )}
              {analyzing && (
                <div className="space-y-2.5">
                  {['INK đọc ý tưởng & tách premise', 'ARIA đánh giá format & audience fit', 'NOVA tổng hợp creative direction'].map((l, i) => (
                    <div key={l} className="flex items-center gap-3 text-[13px] text-gray-300" style={{ animationDelay: `${i * 0.5}s` }}>
                      <Loader2 size={14} className="animate-spin text-[#8a78ff]" style={{ animationDelay: `${i * 0.4}s` }} />
                      {l}
                    </div>
                  ))}
                  <div className="shimmer mt-4 h-2 w-full rounded-full" />
                </div>
              )}
              {analyzed && (
                <div className="space-y-3">
                  {[
                    ['Premise', w.premise],
                    ['Core conflict', w.coreConflict],
                    ['Emotional promise', w.emotionalPromise],
                    ['Unique value', w.uniqueValue],
                  ].map(([k, v]) => (
                    <div key={k} className="cineos-panel p-4">
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#a99dff]/90">{k}</p>
                      <p className="text-[13px] leading-relaxed text-gray-300">{v}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 8 && (
            <div className="fade-up">
              <h2 className="text-lg font-extrabold text-white">Duyệt Project Brief v1.</h2>
              <p className="mt-1 mb-6 text-[13px] text-gray-500">Sửa trực tiếp các trường bên dưới. Duyệt xong mới tạo workspace.</p>
              <div className="space-y-4">
                <div>
                  <label className="cineos-label">Project title</label>
                  <input value={w.title} onChange={(e) => set('title', e.target.value)} className="cineos-input font-semibold" />
                </div>
                <div>
                  <label className="cineos-label">Logline</label>
                  <textarea value={w.logline} onChange={(e) => set('logline', e.target.value)} rows={2} className="cineos-input resize-none" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="cineos-label">Core conflict</label>
                    <textarea value={w.coreConflict} onChange={(e) => set('coreConflict', e.target.value)} rows={3} className="cineos-input resize-none text-[13px]" />
                  </div>
                  <div>
                    <label className="cineos-label">Emotional promise</label>
                    <textarea value={w.emotionalPromise} onChange={(e) => set('emotionalPromise', e.target.value)} rows={3} className="cineos-input resize-none text-[13px]" />
                  </div>
                </div>
                <div>
                  <label className="cineos-label">Unique value</label>
                  <textarea value={w.uniqueValue} onChange={(e) => set('uniqueValue', e.target.value)} rows={2} className="cineos-input resize-none" />
                </div>
              </div>
              <button
                onClick={() => setApproved(!approved)}
                className={`mt-6 flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                  approved ? 'border-emerald-400/40 bg-emerald-400/5' : 'border-white/10 hover:border-white/25'
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${approved ? 'bg-emerald-400 text-[#0b0d10]' : 'border border-white/25'}`}>
                  {approved && <Check size={13} strokeWidth={3} />}
                </span>
                <div>
                  <p className="text-[13px] font-bold text-white">Human approval — anh là Film Owner</p>
                  <p className="text-[12px] text-gray-500">Duyệt brief để NOVA khởi tạo production workspace.</p>
                </div>
              </button>
            </div>
          )}

          {step === 9 && (
            <div className="fade-up flex h-full flex-col items-center justify-center py-10 text-center">
              <span className="nova-pulse mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#8a78ff] to-[#5e9dff] text-white shadow-[0_0_40px_rgba(138,120,255,0.4)]">
                <Rocket size={26} />
              </span>
              <h2 className="text-lg font-extrabold text-white">Sẵn sàng tạo workspace.</h2>
              <p className="mt-1 max-w-sm text-[13px] text-gray-500">
                NOVA sẽ khởi tạo project <span className="font-semibold text-[#a99dff]">{w.title || 'Untitled Project'}</span> ở giai đoạn Development, giao task đầu tiên cho INK và báo anh ngay khi xong.
              </p>
              {error && <p className="mt-4 text-[13px] text-red-400">{error}</p>}
              <button onClick={createProject} disabled={creating} className="cineos-btn-primary mt-6 !px-6">
                {creating ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
                {creating ? 'Đang tạo...' : 'Create Studio Workspace'}
              </button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step < 9 && (
          <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <button onClick={() => (step === 1 ? nav('/') : setStep(step - 1))} className="cineos-btn-ghost !py-2 text-[13px]">
              <ChevronLeft size={15} /> Back
            </button>
            <p className="hidden font-mono text-[11px] text-gray-600 sm:block">
              STEP {String(step).padStart(2, '0')} / 09
            </p>
            <button onClick={() => setStep(step + 1)} disabled={!canContinue} className="cineos-btn-primary !py-2 text-[13px]">
              Continue <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
