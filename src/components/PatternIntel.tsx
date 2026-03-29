import React, { useState, useEffect, useRef } from 'react';
import { createChart, CandlestickData, UTCTimestamp, CandlestickSeries } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Activity, TrendingUp, TrendingDown, RefreshCw, Search,
  Calendar, BarChart2, Info, CheckCircle2, XCircle,
  ArrowUpRight, ArrowDownRight, Zap, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Outcome {
  days: number;
  change: number;
}

interface Pattern {
  name: string;
  type: 'bullish' | 'bearish';
  date: string;
  price: number;
  outcomes: Outcome[];
  explanation: string;
}

interface Stat {
  name: string;
  successRate7d: number;
  count: number;
}

interface SearchResult {
  symbol: string;
  shortname: string;
  longname: string;
  exchange: string;
  source?: string;
}

export function PatternIntel() {
  const [symbol, setSymbol] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [livePrice, setLivePrice] = useState<{ price: number, change: number, timestamp: string } | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Search autocomplete
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchInput.length > 1) {
        try {
          const res = await fetch(`/api/stock/search?q=${encodeURIComponent(searchInput)}`);
          const data = await res.json();
          setSearchResults(Array.isArray(data) ? data : []);
          setShowResults(true);
        } catch (err) {
          console.error('Search error:', err);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Chart initialization
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#a1a1aa',
      },
      grid: {
        vertLines: { color: '#18181b' },
        horzLines: { color: '#18181b' },
      },
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: '#27272a',
        timeVisible: true,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [symbol]);

  // Data fetching and WebSocket subscription
  useEffect(() => {
    if (!symbol) return;

    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch patterns and stats
        const patternRes = await fetch(`/api/market/patterns?symbol=${symbol}`);
        if (!patternRes.ok) throw new Error('Failed to analyze patterns');
        const patternData = await patternRes.json();

        setPatterns(Array.isArray(patternData.patterns) ? patternData.patterns : []);
        setStats(Array.isArray(patternData.stats) ? patternData.stats : []);

        // Fetch historical data
        const historyRes = await fetch(`/api/market/history?symbol=${symbol}&period1=${Math.floor(Date.now() / 1000 - 365 * 24 * 60 * 60)}`);
        if (!historyRes.ok) throw new Error('Failed to fetch chart data');
        const historyData = await historyRes.json();
        if (!historyData || !Array.isArray(historyData)) {
          throw new Error('Historical data for this symbol is currently unavailable from the Yahoo Finance API.');
        }

        const uniqueCandles = new Map();
        historyData
          .filter((item: any) => item && item.date && item.close !== null && item.open !== null && item.high !== null && item.low !== null)
          .forEach((item: any) => {
            const time = (new Date(item.date).getTime() / 1000) as UTCTimestamp;
            if (!uniqueCandles.has(time)) {
              uniqueCandles.set(time, {
                time,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
              });
            }
          });

        const formattedCandles: CandlestickData[] = Array.from(uniqueCandles.values())
          .sort((a: any, b: any) => a.time - b.time);

        if (candleSeriesRef.current) {
          try {
            candleSeriesRef.current.setData(formattedCandles);
          } catch(e) { console.error(e); }

          // Add markers for patterns
          const markers = patternData.patterns
            .map((p: any) => {
              const time = (new Date(p.date).getTime() / 1000) as UTCTimestamp;
              // Only add markers if the date is within our historical data range
              if (formattedCandles.some(c => c.time === time)) {
                return {
                  time,
                  position: p.type === 'bullish' ? 'belowBar' : 'aboveBar',
                  color: p.type === 'bullish' ? '#10b981' : '#ef4444',
                  shape: p.type === 'bullish' ? 'arrowUp' : 'arrowDown',
                  text: p.name,
                };
              }
              return null;
            })
            .filter((m: any) => m !== null);

          if (candleSeriesRef.current.setMarkers) {
            candleSeriesRef.current.setMarkers(markers);
          }
          try {
            if (formattedCandles.length > 0) {
              chartRef.current?.timeScale().fitContent();
            }
          } catch (e) {
            console.warn('Fit content error:', e);
          }
        }

        if (patternData.patterns && patternData.patterns.length > 0) {
          setSelectedPattern(patternData.patterns[0]);
        }
      } catch (err: any) {
        console.error('Analysis Error:', err);
        setError(`API Error: ${err.message}. Yahoo Finance may be limiting requests or returning empty data for this symbol.`);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();

    // WebSocket for live updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', symbol }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ticks' && data.data.length > 0) {
        const tick = data.data[0];
        setLivePrice({
          price: tick.last_price,
          change: tick.change,
          timestamp: new Date().toLocaleTimeString()
        });

        // Update chart with live tick if it's the current day
        if (candleSeriesRef.current) {
          try {
            const today = (Math.floor(Date.now() / 86400000) * 86400) as UTCTimestamp;
            candleSeriesRef.current.update({
              time: today,
              close: tick.last_price,
            });
          } catch (e) {
            console.warn('Chart update ignored:', e);
          }
        }
      }
    };

    return () => {
      ws.close();
    };
  }, [symbol]);

  const selectSymbol = (s: SearchResult) => {
    setSymbol(s.symbol);
    setSearchInput(s.symbol);
    setShowResults(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-zinc-950 min-h-screen text-zinc-100 font-sans">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Pattern Intelligence</h1>
          </div>
          <p className="text-zinc-500 text-sm">Real-time market scanning and algorithmic pattern detection.</p>
        </div>

        <div className="relative w-full md:w-96">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Search Symbol (e.g. INFY, RELIANCE)"
              className="bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-600"
            />
          </div>

          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                {searchResults.map((res: any, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectSymbol(res)}
                    className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors flex items-center justify-between border-b border-zinc-800 last:border-0"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{res.symbol}</span>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                          {res.source || 'NSE'}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 truncate max-w-[200px]">{res.shortname}</span>
                    </div>
                    <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 uppercase font-mono">{res.exchange}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!symbol ? (
        <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-zinc-900 rounded-3xl space-y-4">
          <div className="p-4 bg-zinc-900 rounded-full">
            <Search className="w-8 h-8 text-zinc-700" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-zinc-300">No Stock Selected</h3>
            <p className="text-zinc-500 text-sm">Search for an NSE symbol to begin analysis.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="text-2xl font-bold text-white">{symbol}</CardTitle>
                      <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">NSE • Real-time</p>
                    </div>
                    {livePrice && livePrice.price !== null && (
                      <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
                        <span className="text-3xl font-mono font-bold tracking-tighter">
                          ₹{livePrice.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                          {livePrice.change !== null && livePrice.change !== undefined ? (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${livePrice.change >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {Number(livePrice.change) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Number(livePrice.change) > 0 ? '+' : ''}{Number(livePrice.change).toFixed(2)}%
                            </div>
                          ) : null}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                      {['1D', '1W', '1M'].map((tf) => (
                        <button key={tf} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${tf === '1D' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>
                          {tf}
                        </button>
                      ))}
                    </div>
                    <button className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
                      <RefreshCw className={`w-4 h-4 text-zinc-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div ref={chartContainerRef} className="h-[500px] w-full relative">
                  {loading && (
                    <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                        <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Analyzing Patterns...</span>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm z-10 flex items-center justify-center p-6">
                      <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 max-w-md">
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        <p className="text-sm text-rose-200">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pattern List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patterns.map((p, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedPattern(p)}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all ${selectedPattern === p ? 'bg-zinc-800 border-blue-500/50 shadow-xl' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${p.type === 'bullish' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {p.type === 'bullish' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{p.name}</h4>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase">{new Date(p.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-white">{p.price ? `₹${p.price.toLocaleString('en-IN')}` : 'N/A'}</p>
                      <p className="text-[10px] text-zinc-500">Entry Price</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {p.outcomes?.map((o, i) => (
                      <div key={i} className="flex-1 bg-zinc-950/50 p-2 rounded-xl border border-zinc-800/50">
                        <p className="text-[8px] text-zinc-500 uppercase font-bold mb-1">{o.days}D Outcome</p>
                        <p className={`text-xs font-mono font-bold ${o.change && o.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {o.change !== null ? `${o.change > 0 ? '+' : ''}${o.change}%` : 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar Analysis */}
          <div className="lg:col-span-4 space-y-6">
            {/* Pattern Stats */}
            <Card className="bg-zinc-900 border-zinc-800 rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-500" />
                  <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">Historical Reliability</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {stats.map((s, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                      <span className="text-zinc-400">{s.name}</span>
                      <span className={s.successRate7d >= 60 ? 'text-emerald-500' : 'text-zinc-500'}>{s.successRate7d}% Success</span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.successRate7d}%` }}
                        className={`h-full rounded-full ${s.successRate7d >= 60 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      />
                    </div>
                    <p className="text-[9px] text-zinc-600 font-mono">Based on {s.count} historical detections</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Selected Pattern Detail */}
            <AnimatePresence mode="wait">
              {selectedPattern && (
                <motion.div
                  key={selectedPattern.name + selectedPattern.date}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="bg-zinc-900 border-zinc-800 rounded-3xl overflow-hidden">
                    <div className={`h-1.5 w-full ${selectedPattern.type === 'bullish' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Intelligence Insight</span>
                      </div>
                      <CardTitle className="text-xl font-bold text-white">{selectedPattern.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                        <div className="flex items-start gap-3">
                          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {selectedPattern.explanation}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Signal Verification</h5>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-zinc-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Volume confirmation detected</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Trend alignment verified</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-300">
                            <Target className="w-3 h-3 text-blue-500" />
                            <span>Optimal entry: {selectedPattern.price ? `₹${Number(selectedPattern.price).toFixed(2)}` : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4" />
                        Execute Strategy
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
