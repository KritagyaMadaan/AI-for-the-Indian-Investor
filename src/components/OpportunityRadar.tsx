import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Activity, Zap, Shield, TrendingUp, TrendingDown, RefreshCw, AlertCircle, Info, CheckCircle2, BarChart3, Globe, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";

interface Signal {
  Symbol: string;
  "Signal Type": string;
  "Conviction Score": number;
  Reasoning: string;
  Impact: string;
}

export function OpportunityRadar() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<string>("Neutral");

  const fetchSignals = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch analyzed signals from the specialized Advanced Signal Brain
      const response = await fetch('/api/radar/advanced');
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         const text = await response.text();
         console.error("Non-JSON Response received:", text.slice(0, 100));
         throw new Error("Server returned an invalid response (HTML). The engine might be restarting.");
      }

      const data = await response.json();
      
      if (data.error) {
         setError(`${data.error}: ${data.details || ''}`);
         setLoading(false);
         return;
      }
      
      // The backend returns either a list or an object {signals: [...]}
      const signalsData = Array.isArray(data) ? data : (data.signals || []);
      setSignals(signalsData);
      setSentiment(data.sentiment || "Neutral");
      setLastUpdated(data.timestamp || new Date().toISOString());
    } catch (err: any) {
      console.error('Advanced Radar Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-zinc-950 min-h-screen text-zinc-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Zap className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Opportunity Radar</h1>
          </div>
          <p className="text-zinc-400">Continuous AI scanning of real-world NSE/BSE filings and market sentiment.</p>
        </div>

        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="text-right hidden md:block">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Last Scan</p>
              <p className="text-sm font-mono text-zinc-300">{new Date(lastUpdated).toLocaleTimeString()}</p>
            </div>
          )}
          <button
            onClick={fetchSignals}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Scan
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-bold">Scan Error</p>
            <p className="opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Active Signals</p>
                <p className="text-2xl font-bold text-white">{signals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">High Conviction</p>
                <p className="text-2xl font-bold text-white">
                  {signals.filter(s => s["Conviction Score"] >= 80).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Globe className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Market Sentiment</p>
                <p className={`text-2xl font-bold ${
                  sentiment.includes("Bullish") ? "text-emerald-500" : 
                  sentiment.includes("Bearish") ? "text-red-500" : "text-white"
                }`}>{sentiment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signals Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Live Signal Feed
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live Monitoring Active
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {loading && signals.length === 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : signals.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {signals.sort((a, b) => b["Conviction Score"] - a["Conviction Score"]).map((signal, idx) => (
                <motion.div
                  key={`${signal.Symbol}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden group">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Left: Score & Symbol */}
                        <div className="p-6 md:w-48 bg-zinc-950/50 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-800">
                          <div className="relative w-20 h-20 flex items-center justify-center mb-3">
                            <svg className="w-full h-full -rotate-90">
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-zinc-800"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray={226}
                                strokeDashoffset={226 - (226 * signal["Conviction Score"]) / 100}
                                className={signal["Conviction Score"] >= 80 ? 'text-emerald-500' : 'text-blue-500'}
                              />
                            </svg>
                            <span className="absolute text-xl font-bold">{signal["Conviction Score"]}%</span>
                          </div>
                          <p className="text-2xl font-black tracking-tighter text-white">{signal.Symbol}</p>
                          <p className="text-[10px] text-zinc-500 uppercase font-bold mt-1">Conviction</p>
                        </div>

                        {/* Right: Content */}
                        <div className="flex-1 p-6 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${signal["Signal Type"].toLowerCase().includes('insider') ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                  signal["Signal Type"].toLowerCase().includes('institutional') ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                {signal["Signal Type"]}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-zinc-400">
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                {signal.Impact} Impact
                              </span>
                            </div>

                            <button className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 group/btn">
                              View Source Data
                              <Info className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-lg font-bold text-zinc-100 leading-tight">
                              Actionable Signal Detected in {signal.Symbol}
                            </h3>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                              {signal.Reasoning}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-zinc-800/50 flex flex-col gap-3">
                            <div className="flex items-center gap-4 text-[10px] text-zinc-500 uppercase font-bold">
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                Verified Source
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-blue-500" />
                                Real-time Detection
                              </div>
                            </div>
                            
                            {(signal["Source Info"] || signal["Source Link"]) && (
                              <div className="group/proof relative p-3 bg-zinc-950/80 border border-zinc-800/50 rounded-lg hover:border-blue-500/30 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex flex-col gap-0.5">
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Source Evidence</p>
                                    <p className="text-[9px] text-blue-500 font-bold uppercase">{signal["Source Category"] || "Institutional Data"}</p>
                                  </div>
                                  {signal["Source Link"] && (
                                    <a 
                                      href={signal["Source Link"]} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-[9px] flex items-center gap-1.5 text-blue-400 hover:bg-blue-500/20 rounded font-bold transition-all uppercase"
                                    >
                                      VIEW DOCUMENT
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                                <p className="text-xs font-mono text-zinc-500 group-hover/proof:text-zinc-300 transition-colors leading-tight whitespace-pre-wrap">
                                  {typeof signal["Source Info"] === 'object' 
                                    ? JSON.stringify(signal["Source Info"], null, 2) 
                                    : signal["Source Info"]}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 bg-zinc-900 rounded-full">
                <Activity className="w-12 h-12 text-zinc-700" />
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-400">Scanning for Opportunities...</p>
                <p className="text-sm text-zinc-600">The radar is currently processing real-world filings and news.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
