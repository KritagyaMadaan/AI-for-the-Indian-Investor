import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Send, Bot, User, Loader2, Link as LinkIcon, BarChart2, FileText, Search, Brain, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  thinking?: string[];
  portfolio_context?: boolean;
}

export function MarketGPT() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'I am the Next-Gen Market Intelligence Agent. I have been upgraded with multi-agent reasoning, deeper data integration (including FII/DII flows and Advanced Radar signals), and source-cited analysis. How can I assist your portfolio today?',
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinkingSteps]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userQuery = query;
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setQuery('');
    setLoading(true);
    setThinkingSteps(["Initializing Multi-Agent Intelligence..."]);

    try {
      // STEP 1: DEEPER DATA INTEGRATION (Signals + Institutional Flows)
      setThinkingSteps(prev => [...prev, "Fetching advanced Radar signals and Institutional flows..."]);
      const intelRes = await fetch('/api/chat/intel');
      let intelData = { radar_signals: [], institutional_activity: {} };
      
      // Robust JSON check
      const intelType = intelRes.headers.get("content-type");
      if (intelRes.ok && intelType && intelType.includes("application/json")) {
        try {
          intelData = await intelRes.json();
        } catch (e) { console.error("Intel JSON parse failed"); }
      }

      // STEP 2: NEWS CONTEXT
      setThinkingSteps(prev => [...prev, `Scanning latest business news for "${userQuery}"...`]);
      const newsRes = await fetch(`/api/news?q=${encodeURIComponent(userQuery)}`);
      let newsData = { articles: [] };
      
      const newsType = newsRes.headers.get("content-type");
      if (newsRes.ok && newsType && newsType.includes("application/json")) {
        try {
          newsData = await newsRes.json();
        } catch (e) { console.error("News JSON parse failed"); }
      }

      // STEP 3: PREPARE PROMPT (Multi-step Reasoning)
      setThinkingSteps(prev => [...prev, "Synthesizing cross-market intelligence (Technicals + News + Signals)..."]);
      
      const contextPrompt = `
        MARKET INTELLIGENCE CONTEXT:
        - RADAR SIGNALS (High Conviction): ${JSON.stringify(intelData.radar_signals || []).slice(0, 1000)}
        - INSTITUTIONAL (FII/DII): ${JSON.stringify(intelData.institutional_activity || {})}
        - NEWS CONTEXT: ${JSON.stringify(newsData.articles || []).slice(0, 1000)}
        
        USER QUERY: "${userQuery}"
        
        INSTRUCTIONS:
        1. Analyze the query using ONLY the provided market context.
        2. BE AGGRESSIVE and ACTIONABLE. Use "Signal-Finding" logic.
        3. CITE SOURCES in-line like [Source: Radar] or [Source: News].
        4. If the user mentions a stock, check if we have a Radar signal for it.
        5. Structure: Analysis -> Sentiment -> Actionable Takeaway.
      `;

      // Next-Gen Autonomous Agent (Server-side Multi-Agent Reasoning)
      const aiRes = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: contextPrompt })
      });

      if (!aiRes.ok) {
        const errData = await aiRes.json();
        throw new Error(errData.error || "AI Analysis Proxy Failed");
      }

      const aiData = await aiRes.json();
      const text = aiData.text;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: text,
        sources: aiData.sources || [],
        thinking: aiData.thinking || ["Synthesizing Final Analysis..."]
      }]);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `My apologies. I encountered an error during my reasoning process: ${err.message}. Please verify the backend connectivity.`
      }]);
    } finally {
      setLoading(false);
      setThinkingSteps([]);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            Market GPT <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-bold uppercase tracking-widest">Next-Gen</span>
          </h1>
          <p className="text-zinc-400 mt-1">Multi-agent reasoning with source-cited deep intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10 uppercase tracking-wider">
             <ShieldCheck className="w-3 h-3" /> Portfolio Aware
           </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col bg-zinc-950/50 border-zinc-800/50 overflow-hidden backdrop-blur-md">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide" ref={scrollRef}>
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <Brain className="w-4 h-4 text-blue-400" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-5 ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-lg shadow-blue-500/10'
                    : 'bg-zinc-900/60 text-zinc-300 border border-zinc-800/50 rounded-tl-sm'
                  }`}>
                  <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {msg.sources && (
                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <LinkIcon className="w-3 h-3" /> Intelligence Sources
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((source, sIdx) => (
                          <span key={sIdx} className="px-2 py-1 rounded bg-zinc-950/50 border border-zinc-700/50 text-[9px] text-zinc-500 flex items-center gap-1.5 font-bold uppercase">
                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                <Brain className="w-4 h-4 text-blue-400 animate-pulse" />
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl rounded-tl-sm p-4 flex flex-col gap-3 min-w-[300px]">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Reasoning...</span>
                </div>
                <div className="space-y-1.5">
                  {thinkingSteps.map((step, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] text-zinc-600 flex items-center gap-2"
                    >
                      <div className="w-1 h-3 bg-blue-500/20 rounded-full" />
                      {step}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800/50">
          <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query the Next-Gen Signal Brain (e.g., Cross-analyze FII flow and Radar signals for RELIANCE)"
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-4 pl-5 pr-14 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all shadow-inner"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all shadow-lg"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="mt-3 text-center">
            <p className="text-[10px] text-zinc-700 font-medium uppercase tracking-widest">
              Gemini 2.0 Flash Intelligence • Real-time Radar Integration • Institutional Grade
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
