import React, { useState } from 'react';
import { OpportunityRadar } from './components/OpportunityRadar';
import { PatternIntel } from './components/PatternIntel';
import { MarketGPT } from './components/MarketGPT';
import { VideoEngine } from './components/VideoEngine';
import { DashboardHome } from './components/DashboardHome';
import { 
  Search, Bell, MonitorPlay, Settings, 
  ShieldAlert, Target, Bot, Video, PieChart, 
  HelpCircle, FileText, BarChart2, LayoutDashboard,
  Menu, ChevronRight, Zap, User
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'radar' | 'charts' | 'gpt' | 'video'>('dashboard');

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'radar', label: 'Opportunity Radar', icon: Target },
    { id: 'charts', label: 'Chart Patterns', icon: BarChart2 },
    { id: 'gpt', label: 'MarketGPT', icon: Bot },
    { id: 'video', label: 'Video Engine', icon: Video },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 flex flex-col font-sans selection:bg-blue-500/30">
      {/* Top Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0B1120] z-20 shrink-0">
        <div className="flex items-center gap-12">
          <div className="text-xl font-black text-white tracking-widest uppercase">
            ET MARKETS SENTINEL
          </div>
          <div className="relative group hidden md:block">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Global Alpha Search..." 
              className="bg-[#131B2F]/60 border border-slate-800/60 rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-slate-600 w-[400px] text-slate-200 placeholder:text-slate-600 transition-all font-medium" 
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-6 pr-6 border-r border-slate-800/60">
            <div className="relative">
                <Bell className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer transition-colors" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0B1120]" />
            </div>
            <div className="flex items-center gap-3 bg-zinc-900 border border-slate-800 py-1.5 px-3 rounded-xl hover:bg-zinc-800 cursor-pointer transition-all">
                <div className="w-5 h-5 rounded-full bg-slate-700 overflow-hidden ring-1 ring-slate-600 flex items-center justify-center">
                    <User className="w-3 h-3 text-slate-300" />
                </div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sentinel_User</span>
            </div>
          </div>
          <button className="text-slate-400 hover:text-white hidden lg:block">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-white/5 bg-[#0B1120] flex flex-col shrink-0">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-2xl skew-x-3">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-black text-white tracking-widest leading-none">SENTINEL</div>
                <div className="text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-1">Financial Intelligence</div>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-bold transition-all duration-300 group ${
                    isActive 
                      ? 'bg-[#131B2F] text-white ring-1 ring-white/10 shadow-[0_0_20px_rgba(37,99,235,0.1)]' 
                      : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/10'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-500' : 'text-slate-600 group-hover:text-slate-400'}`} />
                  <span className="uppercase tracking-[0.15em]">{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />}
                </button>
              );
            })}
          </nav>

          <div className="p-8 border-t border-white/5 bg-[#0B1120]/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <div className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Enterprise</div>
                <div className="text-[8px] text-slate-500 font-bold tracking-widest uppercase mt-1 text-nowrap">Full Access Granted</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#0B1120] relative">
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 opacity-50 pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          
          {activeTab === 'dashboard' && <DashboardHome onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === 'radar' && <OpportunityRadar />}
          {activeTab === 'charts' && <PatternIntel />}
          {activeTab === 'gpt' && <MarketGPT />}
          {activeTab === 'video' && <VideoEngine />}
        </main>
      </div>
    </div>
  );
}
