import { Sparkles, Send, Aperture } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { NovaMessage } from '@/lib/types';

const NOVA_GREETING =
  'Studio đang ổn định. Project 001 "The Little Explorer" đang ở giai đoạn Script Development — INK đang viết beat sheet Episode 01. Anh muốn xem tiến độ, duyệt gì mới, hay bắt đầu project mới?';

const QUICK = ['Tình hình studio?', 'Cần duyệt gì?', 'Tạo project mới'];

export function NovaPanel({
  projectId,
  messages,
  onSend,
  compact,
}: {
  projectId: string | null;
  messages: NovaMessage[];
  onSend: (text: string) => void;
  compact?: boolean;
}) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    setInput('');
    onSend(t);
  };

  return (
    <aside className={`flex shrink-0 flex-col border-l border-[#242c3a] bg-[#0f131a] ${compact ? 'w-full' : 'hidden w-80 xl:flex'}`}>
      <div className="flex items-center gap-3 border-b border-[#242c3a] px-4 py-3">
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1b2130] to-[#151a23] ring-1 ring-[#8a78ff]/40">
          <Aperture size={18} className="nova-pulse text-[#8a78ff]" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-white">
            NOVA <Sparkles size={11} className="text-[#8a78ff]" />
          </p>
          <p className="text-[11px] text-[#8b95a7]">Studio Director · online</p>
        </div>
        <span className="ml-auto h-2 w-2 rounded-full bg-[#55d79b] shadow-[0_0_8px_rgba(85,215,155,0.8)]" />
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <div className="fade-up rounded-xl rounded-tl-sm border border-[#8a78ff]/20 bg-[#8a78ff]/5 p-3 text-[13px] leading-relaxed text-gray-200">
          {NOVA_GREETING}
        </div>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`fade-up max-w-[85%] rounded-xl p-3 text-[13px] leading-relaxed ${
              m.role === 'user'
                ? 'ml-auto rounded-tr-sm bg-[#1b2130] text-gray-100'
                : 'rounded-tl-sm border border-[#8a78ff]/20 bg-[#8a78ff]/5 text-gray-200'
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <div className="border-t border-[#242c3a] p-3">
        {!projectId && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button key={q} onClick={() => onSend(q)} className="cineos-chip transition-colors hover:border-[#8a78ff]/40 hover:text-[#a99dff]">
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask NOVA anything..."
            className="cineos-input !py-2 text-[13px]"
          />
          <button onClick={send} disabled={!input.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#8a78ff] to-[#5e9dff] text-white transition-all hover:brightness-110 disabled:opacity-40">
            <Send size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
