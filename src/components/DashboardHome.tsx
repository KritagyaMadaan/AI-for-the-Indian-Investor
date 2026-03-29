import React from 'react';
import { motion } from 'framer-motion';
import { 
  Radar, BarChart3, MessageSquare, Play, 
  Search, Bell, User, ChevronRight, Zap, TrendingUp 
} from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface DashboardHomeProps {
  onNavigate: (tab: 'radar' | 'charts' | 'gpt' | 'video') => void;
}

export function DashboardHome({ onNavigate }: DashboardHomeProps) {
  const [intel, setIntel] = React.useState<any>(null);

  React.useEffect(() => {
    fetch('/api/market-rover/intelligence')
      .then(res => res.json())
      .then(data => setIntel(data))
      .catch(err => console.error('Failed to fetch rover intel', err));
  }, []);

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-zinc-400 text-sm font-semibold tracking-wider uppercase mb-2">Intelligence Hub</h2>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Predictive alpha signals and AI synthesis for modern markets.
          </h1>
        </div>
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl self-start">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Market Sentiment</span>
          <span className="text-emerald-500 font-black text-sm uppercase tracking-tighter">Strong Bullish</span>
        </div>
      </div>

      {/* Market-Rover Intelligence Bar (NEW) */}
      {intel && (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 px-6 bg-zinc-950/40 border border-slate-800/60 rounded-[1.5rem] backdrop-blur-xl"
        >
            <div className="flex items-center gap-4 border-r border-slate-800/60 last:border-0 pr-6">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">FII/DII Flows</p>
                    <p className="text-sm font-bold text-zinc-100">
                        FII: <span className={intel.institutional.fii.includes('-') ? 'text-red-400' : 'text-emerald-400'}>{intel.institutional.fii}Cr</span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 border-r border-slate-800/60 last:border-0 px-6">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Zap className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Sector Rotation Leader</p>
                    <p className="text-sm font-bold text-zinc-100">
                        {intel.sector_rotation[0]?.name || 'N/A'} <span className="text-emerald-400">+{intel.sector_rotation[0]?.return || 0}%</span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 last:border-0 pl-6">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-0.5">Recent IPO Spotlight</p>
                    <p className="text-sm font-bold text-zinc-100 line-clamp-1">
                        {intel.ipo[0]?.NAME || 'Checking Listings...'}
                    </p>
                </div>
            </div>
        </motion.div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 auto-rows-fr">
        
        {/* Opportunity Radar Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="group relative cursor-pointer"
          onClick={() => onNavigate('radar')}
        >
          <Card className="h-full bg-[#131B2F]/40 border-slate-800/60 hover:border-blue-500/40 transition-all duration-300 rounded-[2rem] overflow-hidden backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-8 flex flex-col h-full relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div className="w-14 h-14 rounded-2xl bg-zinc-950/80 border border-slate-800 flex items-center justify-center shadow-2xl skew-x-3 group-hover:skew-x-0 transition-transform">
                    <Radar className="w-7 h-7 text-white" />
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-emerald-500/10">
                    8 New Signals
                </span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-white mb-4">Opportunity Radar</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                  AI-detected anomalies and momentum shifts across 5,000+ global symbols. Instant detection of institutional accumulation.
                </p>
              </div>

              <button className="mt-8 self-start px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 flex items-center gap-3 group-hover:translate-x-1 transition-transform">
                Enter Terminal
                <ChevronRight className="w-4 h-4" />
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chart Intelligence Card */}
        <motion.div
            whileHover={{ y: -4 }}
            className="group relative cursor-pointer"
            onClick={() => onNavigate('charts')}
        >
          <Card className="h-full bg-[#131B2F]/40 border-slate-800/60 hover:border-emerald-500/40 transition-all duration-300 rounded-[2rem] overflow-hidden backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-8 flex flex-col h-full relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div className="w-14 h-14 rounded-2xl bg-zinc-950/80 border border-slate-800 flex items-center justify-center shadow-2xl -skew-x-3 group-hover:skew-x-0 transition-transform">
                    <BarChart3 className="w-7 h-7 text-emerald-500" />
                </div>
                <span className="bg-slate-900/80 text-slate-500 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-800">
                    Pattern Engine V2
                </span>
              </div>
              
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-white mb-4">Chart Intelligence</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                  Automated technical analysis. Identifies breakouts, head-and-shoulders, and wedge patterns with 84% historical accuracy.
                </p>
              </div>

              <button className="mt-8 self-start px-8 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-3">
                Launch Analysis
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* MarketGPT Card */}
        <motion.div
            whileHover={{ y: -4 }}
            className="group relative cursor-pointer"
            onClick={() => onNavigate('gpt')}
        >
          <Card className="h-full bg-[#131B2F]/40 border-slate-800/60 hover:border-blue-500/40 transition-all duration-300 rounded-[2rem] overflow-hidden backdrop-blur-xl">
            <CardContent className="p-8 flex flex-col h-full relative z-10">
              <div className="flex items-start mb-8">
                <div className="w-14 h-14 rounded-2xl bg-zinc-950/80 border border-slate-800 flex items-center justify-center shadow-2xl">
                    <MessageSquare className="w-7 h-7 text-blue-500" />
                </div>
                <div className="ml-6 flex-1 h-[1px] bg-gradient-to-r from-slate-700 to-transparent self-center" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-white mb-4">MarketGPT</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-8">
                  Ask anything about market movements, earnings transcripts, or sector trends. Real-time synthesis of global financial news.
                </p>

                <div className="relative mb-6 group/input">
                    <input 
                        readOnly
                        placeholder='"Summarize the impact of Fed rate holds on tech..." ' 
                        className="w-full bg-[#0B1120] border border-slate-800 rounded-2xl py-5 px-6 text-sm italic text-slate-500 focus:outline-none cursor-pointer"
                    />
                    <Zap className="w-4 h-4 text-blue-500 absolute right-6 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button className="w-full py-4 bg-[#1E293B]/60 text-white rounded-2xl text-sm font-bold hover:bg-[#1E293B] transition-colors border border-slate-700/50">
                Start Chatting
              </button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Video Engine Card */}
        <motion.div
            whileHover={{ y: -4 }}
            className="group relative cursor-pointer"
            onClick={() => onNavigate('video')}
        >
          <Card className="h-full bg-zinc-900 border-slate-800 hover:border-purple-500/40 transition-all duration-300 rounded-[2rem] overflow-hidden relative shadow-2xl">
            <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                <img src="https://picsum.photos/seed/trading/800/600" className="w-full h-full object-cover" alt="stock chart" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            
            <CardContent className="p-8 flex flex-col h-full relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div className="w-14 h-14 rounded-2xl bg-yellow-500 flex items-center justify-center shadow-xl">
                    <Play className="w-7 h-7 text-zinc-950 fill-current" />
                </div>
                <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-900 overflow-hidden">
                            <img src={`https://picsum.photos/seed/face${i}/50/50`} className="w-full h-full object-cover" alt="User" />
                        </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-white">
                        +12
                    </div>
                </div>
              </div>
              
              <div className="flex-1 mt-auto">
                <h3 className="text-3xl font-bold text-white mb-4">Video Engine</h3>
                <p className="text-zinc-300/80 text-sm leading-relaxed max-w-sm">
                  Auto-generated daily wrap videos. Watch AI-curated summaries of market action from the last 24 hours.
                </p>
              </div>

              <button className="mt-8 w-fit px-8 py-3 bg-zinc-950/80 backdrop-blur-xl border border-slate-700 text-white rounded-xl text-sm font-bold hover:bg-zinc-900 transition-colors flex items-center gap-3">
                Watch Latest Wrap
                <Play className="w-4 h-4" />
              </button>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
