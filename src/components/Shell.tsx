import { Film, Home, Clapperboard, Boxes, Bot, ListChecks, BarChart3, Settings, Search, Plus, Bell, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState } from 'react';

export type Route =
  | { view: 'home' }
  | { view: 'projects' }
  | { view: 'wizard' }
  | { view: 'project'; id: string };

const GLOBAL_NAV: { icon: typeof Home; label: string; badge?: 'approvals' }[] = [
  { icon: Home, label: 'Studio Home' },
  { icon: Clapperboard, label: 'Projects' },
  { icon: Boxes, label: 'Asset Library' },
  { icon: Bot, label: 'Agents' },
  { icon: ListChecks, label: 'Tasks' },
  { icon: BarChart3, label: 'Analytics' },
];

export function TopBar({ onNavigate, onNewProject }: { onNavigate: (r: Route) => void; onNewProject: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-[#242c3a] bg-[#090c11]/95 px-4 backdrop-blur">
      <button onClick={() => onNavigate({ view: 'home' })} className="group flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#8a78ff] to-[#5e9dff] text-white shadow-[0_0_20px_rgba(138,120,255,0.35)] transition-transform group-hover:scale-105">
          <Film size={17} strokeWidth={2.4} />
        </span>
        <span className="text-[15px] font-extrabold tracking-[0.22em] text-white">
          CINE<span className="ai-text">OS</span>
        </span>
      </button>

      <div className="relative ml-2 hidden max-w-md flex-1 md:block">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          placeholder="Search projects, scenes, assets..."
          className="cineos-input !py-2 pl-9 text-[13px]"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onNavigate({ view: 'projects' });
          }}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onNewProject}
          className="cineos-btn-primary !px-3.5 !py-2 text-[13px]"
        >
          <Plus size={15} strokeWidth={2.6} /> New Project
        </button>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#242c3a] text-[#8b95a7] transition-colors hover:border-[#303a4b] hover:text-white">
          <Bell size={15} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f0bb62]" />
        </button>
        <button className="hidden h-9 items-center gap-2 rounded-lg border border-[#242c3a] px-2.5 text-[13px] font-medium text-gray-300 transition-colors hover:border-[#303a4b] sm:flex">
          <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-gradient-to-br from-[#8a78ff] to-[#5e9dff] text-[10px] font-bold text-white">AN</span>
          Anh <ChevronDown size={13} className="text-[#8b95a7]" />
        </button>
      </div>
    </header>
  );
}

export function LeftNav({ collapsed, onToggle, onNavigate }: { collapsed: boolean; onToggle: () => void; onNavigate: (r: Route) => void }) {
  const [active, setActive] = useState('Studio Home');
  return (
    <nav
      className={`sticky left-0 top-14 z-20 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col border-r border-[#242c3a] bg-[#0f131a] transition-all duration-300 lg:flex ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="flex-1 overflow-y-auto py-3">
        <p className={`mb-1 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#4a5568] ${collapsed ? 'text-center !px-0' : ''}`}>
          {collapsed ? '•••' : 'Studio'}
        </p>
        {GLOBAL_NAV.map((item) => {
          const isActive = active === item.label;
          return (
            <button
              key={item.label}
              onClick={() => {
                setActive(item.label);
                if (item.label === 'Studio Home') onNavigate({ view: 'home' });
                if (item.label === 'Projects') onNavigate({ view: 'projects' });
              }}
              title={collapsed ? item.label : undefined}
              className={`group relative mx-2 mb-0.5 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-[#8a78ff]/15 text-[#a99dff]'
                  : 'text-[#8b95a7] hover:bg-[#1b2130] hover:text-gray-100'
              }`}
            >
              {isActive && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[#8a78ff]" />}
              <item.icon size={16} strokeWidth={2} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>
      <div className="border-t border-white/10 p-2">
        <button
          onClick={onToggle}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-200 ${collapsed ? 'justify-center !px-0' : ''}`}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          {!collapsed && 'Collapse'}
        </button>
        <button
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-200 ${collapsed ? 'justify-center !px-0' : ''}`}
        >
          <Settings size={16} />
          {!collapsed && 'Settings'}
        </button>
      </div>
    </nav>
  );
}
