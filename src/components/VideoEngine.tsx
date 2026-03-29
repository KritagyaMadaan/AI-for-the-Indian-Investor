import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, Video, Download, Settings, RefreshCw, BarChart, Globe, Zap, History, Target } from 'lucide-react';

export function VideoEngine() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [targetAsset, setTargetAsset] = useState('NIFTY 50');
  const [error, setError] = useState<string | null>(null);
  const [marketIntel, setMarketIntel] = useState<any>(null);

  useEffect(() => {
    fetchMarketIntel();
  }, []);

  const fetchMarketIntel = async () => {
    try {
      const res = await fetch('/api/market/intelligence');
      const data = await res.json();
      setMarketIntel(data);
    } catch (e) {
      console.error('Failed to fetch market intel:', e);
    }
  };

  const [sources, setSources] = useState({
    fii: true,
    ipo: true,
    pattern: true
  });

  const toggleSource = (id: keyof typeof sources) => {
    setSources(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerate = async () => {
    try {
      setError(null);
      setGenerating(true);
      setProgress(10);
      setVideoUrl(null);

      const params = new URLSearchParams({
        symbol: targetAsset,
        lang: 'en',
        fii: sources.fii.toString(),
        ipo: sources.ipo.toString(),
        pattern: sources.pattern.toString()
      });

      const response = await fetch(`/api/video/generate?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Video generation failed.');
      }

      setVideoUrl(data.url);
      setProgress(100);
    } catch (err: any) {
      console.error('Video generation error:', err);
      setError(err.message || 'Failed to generate financial news video.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 h-full bg-[#0B1120] space-y-8">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Video className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-widest uppercase">Broadcast Engine</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">Next-Gen Autonomous Financial News Production System.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Status: Ready</div>
            <div className="text-xs font-black text-emerald-400 uppercase tracking-wider mt-1">AI Node Online</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#131B2F] border border-white/5 flex items-center justify-center">
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left: Input & Config */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="bg-[#131B2F]/40 border-slate-800/40 backdrop-blur-xl">
            <CardHeader className="pb-4 border-b border-white/5">
              <CardTitle className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Asset Target
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Enter Symbol (e.g. RELIANCE)</label>
                 <div className="relative">
                   <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
                   <input
                     type="text"
                     value={targetAsset}
                     onChange={(e) => setTargetAsset(e.target.value)}
                     className="w-full bg-[#0B1120] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                   />
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Intelligence Sources</div>
                 <div className="space-y-2">
                    {[
                      { id: 'fii', label: 'FII/DII Net Flow' },
                      { id: 'ipo', label: 'IPO Pulse Track' },
                      { id: 'pattern', label: 'Pattern Intelligence' }
                    ].map(src => (
                      <div 
                        key={src.id} 
                        onClick={() => toggleSource(src.id as any)}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#0B1120]/60 border border-slate-800/40 cursor-pointer hover:border-blue-500/30 transition-all"
                      >
                        <span className={`text-xs font-bold transition-colors ${sources[src.id as keyof typeof sources] ? 'text-slate-300' : 'text-slate-600'}`}>{src.label}</span>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${sources[src.id as keyof typeof sources] ? 'bg-blue-500/20' : 'bg-slate-800'}`}>
                          <div className={`absolute top-1 w-2 h-2 rounded-full transition-all ${sources[src.id as keyof typeof sources] ? 'right-1 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'left-1 bg-slate-600'}`} />
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3"
              >
                {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {generating ? `Producing... ${progress}%` : 'Generate Intelligence'}
              </button>
            </CardContent>
          </Card>

          {/* FII/DII Mini-Board */}
          <Card className="bg-zinc-900/40 border-slate-800/40">
             <CardHeader className="py-3 border-b border-white/5">
                <CardTitle className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <BarChart className="w-3.5 h-3.5 text-emerald-500" />
                  Institutional Pulse
                </CardTitle>
             </CardHeader>
             <CardContent className="pt-4">
                <div className="space-y-3">
                  {marketIntel?.fii_dii?.slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-1 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                         <span>{item.Date || 'Today'}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-xs font-black text-blue-400">FII: {item['FII Buy value']} Cr</span>
                         <span className="text-xs font-black text-emerald-400">DII: {item['DII Buy value']} Cr</span>
                      </div>
                    </div>
                  ))}
                  {!marketIntel && <div className="text-[10px] font-bold text-zinc-600 animate-pulse">Scanning exchange data...</div>}
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Center: Video Preview (Interactive Mode) */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-[#131B2F]/60 border-slate-800/40 overflow-hidden group min-h-[500px] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-white/5 bg-[#131B2F]/80 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-xs font-black text-white uppercase tracking-widest">Master Production Preview</span>
               </div>
               <History className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white" />
            </div>
            
            <CardContent className="flex-1 p-0 flex items-center justify-center bg-black/60 relative">
              {!generating && !videoUrl && (
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-[#131B2F]/80 border border-slate-800 flex items-center justify-center mx-auto mb-6 shadow-2xl translate-y-0 group-hover:-translate-y-2 transition-transform duration-500">
                    <Video className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Initialize Broadcast</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto font-medium">Ready to synthesize multi-agent intelligence into a high-fidelity video.</p>
                </div>
              )}

              {generating && (
                <div className="w-full max-w-sm text-center space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="space-y-3">
                    <div className="flex justify-between text-[11px] font-black text-blue-500 uppercase tracking-widest">
                      <span>{progress < 40 ? 'Synthesizing Audio' : progress < 70 ? 'Rendering Charts' : 'Compiling Video'}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#131B2F] rounded-full overflow-hidden p-0.5">
                      <div className="h-full bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 px-8 opacity-40">
                     {[1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-800 rounded animate-pulse" />)}
                  </div>
                </div>
              )}

              {videoUrl && !generating && (
                <div className="absolute inset-0 bg-[#0B1120]">
                  <video 
                    src={videoUrl} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: IPO Tracker Pulse */}
        <div className="xl:col-span-1">
          <Card className="bg-[#131B2F]/40 border-slate-800/40 h-full backdrop-blur-xl">
             <CardHeader className="p-5 border-b border-white/5">
                <CardTitle className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  IPO Pulse Tracker
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y divide-white/5 max-h-[700px] overflow-y-auto no-scrollbar">
                   {marketIntel?.ipo_tracker?.slice(0, 10).map((ipo: any, idx: number) => (
                      <div key={idx} className="p-4 hover:bg-white/5 transition-colors group cursor-default">
                         <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-white tracking-widest uppercase">{ipo.SYMBOL}</span>
                            <span className="text-[9px] font-bold text-slate-500">{ipo.SERIES}</span>
                         </div>
                         <div className="text-[10px] font-medium text-slate-500 truncate mb-2">{ipo.NAME}</div>
                         <div className="flex items-center justify-between">
                            <div className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">Recently Listed</div>
                            <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-blue-500 transition-colors" />
                         </div>
                      </div>
                   ))}
                   {!marketIntel && [1,2,3,4,5].map(i => (
                      <div key={i} className="p-5 animate-pulse space-y-2">
                        <div className="h-2 w-20 bg-slate-800 rounded" />
                        <div className="h-2 w-32 bg-slate-700 rounded" />
                      </div>
                   ))}
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const ChevronRight = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}><path d="M9 18l6-6-6-6" /></svg>
);
