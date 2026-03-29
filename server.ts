import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import YahooFinance from 'yahoo-finance2';
import axios from 'axios';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '98b316f5ef444be2bcd185dd0eed2dba';

const yahooFinance = new YahooFinance({
  validation: { logErrors: false }
});

// Disable validation to prevent crashes from Yahoo's changing API schema - REMOVED for debug
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3000;

// Cache for NSE instruments
let nseInstruments: any[] = [];

async function fetchNSEInstruments() {
  try {
    console.log('Fetching NSE instruments...');
    // Zerodha Kite instruments dump (CSV format)
    const response = await axios.get('https://api.kite.trade/instruments');
    const lines = response.data.split('\n');
    const headers = lines[0].split(',');

    const instruments = lines.slice(1).map((line: string) => {
      const cols = line.split(',');
      if (cols.length < 5) return null;
      // instrument_token,exchange_token,tradingsymbol,name,last_price,expiry,strike,tick_size,lot_size,instrument_type,segment,exchange
      return {
        symbol: cols[2],
        name: cols[3],
        exchange: cols[11],
        segment: cols[10]
      };
    }).filter((i: any) => i && i.exchange === 'NSE' && i.segment === 'NSE');

    nseInstruments = instruments;
    console.log(`Loaded ${nseInstruments.length} NSE instruments.`);
  } catch (error) {
    console.error('Failed to fetch NSE instruments:', error);
  }
}

// Pattern Detection Logic
function detectPatterns(ohlc: any[]) {
  if (!ohlc || !Array.isArray(ohlc)) return { patterns: [], stats: [] };
  const validData = ohlc.filter(d => d && d.date && d.close != null && d.high != null && d.low != null);
  if (validData.length < 50) return { patterns: [], stats: [] };

  const patterns: any[] = [];
  const prices = validData.map(d => d.close);
  const highs = validData.map(d => d.high);
  const lows = validData.map(d => d.low);
  const dates = validData.map(d => d.date);

  // 1. Moving Average Crossover (Golden/Death Cross)
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);

  for (let i = 201; i < prices.length; i++) {
    const prev50 = sma50[i - 1];
    const curr50 = sma50[i];
    const prev200 = sma200[i - 1];
    const curr200 = sma200[i];

    if (prev50 <= prev200 && curr50 > curr200) {
      patterns.push({
        name: 'Golden Cross',
        type: 'bullish',
        date: dates[i],
        price: prices[i],
        explanation: '50-day SMA crossed above 200-day SMA, signaling a long-term bullish trend.'
      });
    } else if (prev50 >= prev200 && curr50 < curr200) {
      patterns.push({
        name: 'Death Cross',
        type: 'bearish',
        date: dates[i],
        price: prices[i],
        explanation: '50-day SMA crossed below 200-day SMA, signaling a long-term bearish trend.'
      });
    }
  }

  // 2. Breakouts (Resistance/Support)
  // Find local peaks in the last 20 days
  for (let i = 20; i < prices.length; i++) {
    const window = highs.slice(i - 20, i);
    const resistance = Math.max(...window);

    if (prices[i] > resistance && prices[i - 1] <= resistance) {
      patterns.push({
        name: 'Resistance Breakout',
        type: 'bullish',
        date: dates[i],
        price: prices[i],
        explanation: 'Price broke above a 20-day resistance level with strong momentum.'
      });
    }

    const windowLows = lows.slice(i - 20, i);
    const support = Math.min(...windowLows);
    if (prices[i] < support && prices[i - 1] >= support) {
      patterns.push({
        name: 'Support Breakdown',
        type: 'bearish',
        date: dates[i],
        price: prices[i],
        explanation: 'Price broke below a 20-day support level, indicating further downside.'
      });
    }
  }

  // Calculate Success Stats for each pattern type
  const patternTypes = ['Golden Cross', 'Death Cross', 'Resistance Breakout', 'Support Breakdown'];
  const stats = patternTypes.map(name => {
    const instances = patterns.filter(p => p.name === name);
    if (instances.length === 0) return { name, successRate7d: 0, count: 0 };

    let successful = 0;
    instances.forEach(p => {
      const idx = validData.findIndex(d => d.date === p.date);
      if (idx !== -1 && idx + 7 < validData.length) {
        const priceAfter7 = validData[idx + 7].close;
        const gain = ((priceAfter7 - p.price) / p.price) * 100;
        if (p.type === 'bullish' ? gain > 0 : gain < 0) successful++;
      }
    });

    return {
      name,
      successRate7d: Math.round((successful / instances.length) * 100),
      count: instances.length
    };
  });

  // Calculate outcomes for each pattern instance
  patterns.forEach(p => {
    const idx = validData.findIndex(d => d.date === p.date);
    p.outcomes = [1, 7, 30].map(days => {
      if (idx !== -1 && idx + days < validData.length) {
        return { days, change: Number(((validData[idx + days].close - p.price) / p.price * 100).toFixed(2)) };
      }
      return null;
    }).filter(o => o !== null);
  });

  return { patterns: patterns.slice(-10), stats }; // Return latest 10 patterns
}

function calculateSMA(data: number[], period: number) {
  const sma = new Array(data.length).fill(null);
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma[i] = sum / period;
  }
  return sma;
}

async function startServer() {
  await fetchNSEInstruments();

  app.use(express.json());

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      apis: {
        twelveData: !!TWELVE_DATA_API_KEY,
        yahooFinance: !!yahooFinance
      }
    });
  });

  // API: Search Stocks
  app.get('/api/stock/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) return res.json([]);

      const query = String(q).toUpperCase();

      // Search in cached Zerodha instruments first
      let results = nseInstruments
        .filter(i => i.symbol.includes(query) || i.name.toUpperCase().includes(query))
        .slice(0, 10)
        .map(i => ({
          symbol: i.symbol,
          shortname: i.name,
          longname: i.name,
          exchange: i.exchange,
          source: 'Zerodha'
        }));

      // Fallback or Supplemental Search via Twelve Data (More reliable for global symbols)
      if (results.length < 10) {
        try {
          const tdSearchRes = await axios.get(`https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${TWELVE_DATA_API_KEY}`);
          if (tdSearchRes.data && tdSearchRes.data.data) {
            const tdStocks = tdSearchRes.data.data
              .filter((q: any) => q.instrument_type === 'Common Stock' && (q.exchange === 'NSE' || q.exchange === 'BSE'))
              .map((q: any) => ({
                symbol: q.symbol,
                shortname: q.instrument_name,
                longname: q.instrument_name,
                exchange: q.exchange,
                source: 'Twelve Data'
              }));

            const seen = new Set(results.map(r => r.symbol));
            for (const stock of tdStocks) {
              if (!seen.has(stock.symbol)) {
                results.push(stock);
                seen.add(stock.symbol);
              }
            }
          }
        } catch (e) {
          console.warn('Twelve Data Search failed, falling back to Yahoo.');
        }

        if (results.length < 5) {
          const yfResult = await yahooFinance.search(String(q)) as any;
          const yfStocks = yfResult.quotes
            .filter((quote: any) => (quote.quoteType === 'EQUITY' || quote.quoteType === 'INDEX') && quote.symbol)
            .map((quote: any) => ({
              symbol: quote.symbol.replace('.NS', '').replace('.BO', ''),
              shortname: quote.shortname || quote.symbol,
              longname: quote.longname || quote.symbol,
              exchange: quote.exchange,
              source: 'Yahoo'
            }));

          const seen = new Set(results.map(r => r.symbol));
          for (const stock of yfStocks) {
            if (!seen.has(stock.symbol)) {
              results.push(stock);
              seen.add(stock.symbol);
            }
          }
        }
      }

      res.json(results.slice(0, 15));
    } catch (error: any) {
      console.error('Search API Error:', error.message);
      res.status(500).json({ error: 'Failed to search stocks', details: error.message });
    }
  });

  // API: Historical Data
  app.get('/api/market/history', async (req, res) => {
    const { symbol, period1, period2, interval } = req.query;
    try {
      // Try Twelve Data Time Series first (Better for charts)
      let formatted: any[] = [];
      let tdSymbol = String(symbol);
      if (!tdSymbol.includes(':')) {
        tdSymbol = `${tdSymbol}:NSE`;
      }

      try {
        const tdRes = await axios.get(`https://api.twelvedata.com/time_series?symbol=${tdSymbol}&interval=${interval || '1day'}&outputsize=250&apikey=${TWELVE_DATA_API_KEY}`);
        if (tdRes.data && tdRes.data.values) {
          formatted = tdRes.data.values.map((v: any) => ({
            date: v.datetime,
            open: parseFloat(v.open),
            high: parseFloat(v.high),
            low: parseFloat(v.low),
            close: parseFloat(v.close),
            volume: parseInt(v.volume) || 0
          })).reverse(); // Twelve Data returns newest first
        }
      } catch (e) {
        console.warn('Twelve Data history failed, falling back to Yahoo.');
      }

      if (formatted.length === 0) {
        // Fallback to Yahoo Finance
        let yfSymbol = String(symbol);
        if (!yfSymbol.includes('.')) yfSymbol = `${yfSymbol}.NS`;

        const queryOptions: any = {
          period1: period1 ? (isNaN(Number(period1)) ? String(period1) : Number(period1)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        };

        if (period2) queryOptions.period2 = isNaN(Number(period2)) ? String(period2) : Number(period2);
        if (interval) queryOptions.interval = String(interval);

        const result = await yahooFinance.chart(yfSymbol, queryOptions) as any;

        if (result && result.quotes && Array.isArray(result.quotes)) {
          formatted = result.quotes
            .filter((q: any) => q && q.date && q.close != null)
            .map((q: any) => ({
              date: q.date,
              open: q.open ?? q.close,
              high: q.high ?? q.close,
              low: q.low ?? q.close,
              close: q.close,
              volume: q.volume ?? 0
            }));
        }
      }

      res.json(formatted);
    } catch (error: any) {
      console.error('History Error:', error.message);
      res.status(500).json({ error: 'Failed to fetch historical data', details: error.message });
    }
  });

  // API: Pattern Intelligence
  app.get('/api/market/patterns', async (req, res) => {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    let yfSymbol = String(symbol);
    if (!yfSymbol.includes('.')) yfSymbol = `${yfSymbol}.NS`;

    try {
      // Fetch 2 years of data to ensure enough for 200 SMA and forward analysis
      const now = new Date();
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(now.getFullYear() - 2);

      const result = await yahooFinance.chart(yfSymbol, {
        period1: twoYearsAgo.toISOString().split('T')[0],
        interval: '1d'
      }) as any;

      const analysis = detectPatterns(result.quotes);
      res.json(analysis);
    } catch (error: any) {
      console.error('Pattern Error:', error.message);
      res.status(500).json({ error: 'Failed to analyze patterns', details: error.message });
    }
  });

  // API: Opportunity Radar Raw Data
  app.get('/api/radar/raw-data', async (req, res) => {
    try {
      // 1. Fetch real trending symbols in India
      let trending: any = { quotes: [] };
      try {
        trending = await yahooFinance.trendingSymbols('IN') as any;
      } catch (e) {
        console.warn('Trending symbols fetch failed, falling back to search');
        trending = await yahooFinance.search('NSE') as any;
      }

      // 2. Fetch broad market news for India
      const newsResult = await yahooFinance.search('NSE India Stock Market News') as any;

      // 3. Fetch specific news for top trending symbols and key movers
      const topSymbols = trending.quotes
        .filter((q: any) => q && q.symbol)
        .slice(0, 10)
        .map((q: any) => q.symbol);
      
      // Fallback to blue-chips if trending is sparse
      if (topSymbols.length < 5) topSymbols.push('RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS');

      const companyNews = await Promise.all(
        topSymbols.map(async (symbol: string) => {
          try {
            const search = await yahooFinance.search(symbol) as any;
            return {
              symbol: symbol.replace('.NS', ''),
              news: search.quotes.slice(0, 3).map((n: any) => n.title)
            };
          } catch (e) {
            return null;
          }
        })
      );

      const data = {
        timestamp: new Date().toISOString(),
        trending: trending.quotes
          .filter((q: any) => q && q.symbol)
          .map((q: any) => ({
            symbol: q.symbol.replace('.NS', ''),
            name: q.shortname || q.symbol
          })),
        news: newsResult.quotes.map((q: any) => ({
          title: q.title,
          publisher: q.publisher,
          link: q.link,
          type: q.type
        })),
        companyIntelligence: companyNews.filter(c => c !== null),
        // We provide these as empty or derived from news to maintain frontend compatibility 
        // while ensuring the AI only sees REAL data from the news/trending feeds.
        announcements: newsResult.quotes.filter((q: any) => q.type === 'STORY').map((q: any) => ({
          title: q.title,
          source: q.publisher,
          date: new Date().toISOString().split('T')[0]
        })),
        bulkDeals: [], // Removed simulated data
        insiderTrading: [], // Removed simulated data
        boardMeetings: [] // Removed simulated data
      };

      res.json(data);
    } catch (error: any) {
      console.error('Radar Raw Data Error:', error.message);
      res.status(500).json({ error: 'Failed to fetch real-time radar data', details: error.message });
    }
  });

  // API: Market News for GPT
  app.get('/api/news', async (req, res) => {
    const { q } = req.query;
    try {
      const query = q ? `${q} NSE India stock` : 'NSE India stock market';
      const newsResult = await yahooFinance.search(query) as any;

      if (!newsResult || !newsResult.quotes) {
        return res.json({ articles: [] });
      }

      const articles = newsResult.quotes
        .filter((q: any) => q.title || q.shortname)
        .map((q: any) => ({
          title: q.title || q.shortname || q.symbol,
          description: q.publisher || 'Financial news update',
          source: { name: q.publisher || 'Yahoo Finance' },
          url: q.link
        }));

      res.json({ articles });
    } catch (error: any) {
      console.error('News API Error:', error.message);
      res.status(500).json({ error: 'Failed to fetch news', details: error.message });
    }
  });

  // API: Advanced Opportunity Radar (Signal Brain Integration)
  app.get('/api/radar/advanced', async (req, res) => {
    try {
      const { spawn } = await import('child_process');
      const pythonProcess = spawn('python', ['opportunity_radar_engine.py']);
      
      let output = '';
      pythonProcess.stdout.on('data', (d) => output += d.toString());
      
      pythonProcess.on('close', (code) => {
        try {
          const radar = JSON.parse(output.trim());
          res.json(Array.isArray(radar) ? { signals: radar, timestamp: new Date().toISOString() } : radar);
        } catch (e) {
          res.status(200).json({ signals: [], error: 'Logic failure' });
        }
      });
    } catch (err: any) {
      res.status(200).json({ signals: [], error: 'Internal server error' });
    }
  });

  // API: Market Intelligence Context for GPT (Deeper Integration)
  app.get('/api/chat/intel', async (req, res) => {
    try {
      // 1. Fetch live radar signals from our advanced engine
      const { spawn } = await import('child_process');
      const radarProcess = spawn('python', ['opportunity_radar_engine.py']);
      
      let radarOutput = '';
      radarProcess.stdout.on('data', (d) => radarOutput += d.toString());
      
      const radarResult = await new Promise((resolve) => {
        radarProcess.on('close', () => {
          try { resolve(JSON.parse(radarOutput)); } catch (e) { resolve({ signals: [] }); }
        });
      });

      // 2. Fetch Institutional FII/DII and Sector Rotation
      const roverProcess = spawn('python', ['market_rover_data.py']);
      let roverOutput = '';
      roverProcess.stdout.on('data', (d) => roverOutput += d.toString());

      const roverResult = await new Promise((resolve) => {
        roverProcess.on('close', () => {
          try { resolve(JSON.parse(roverOutput)); } catch (e) { resolve({}); }
        });
      });

      // 3. Current Date Context
      const context = {
        timestamp: new Date().toISOString(),
        radar_signals: (radarResult as any).signals || [],
        institutional_activity: (roverResult as any).institutional || {},
        sector_rotation: (roverResult as any).sector_rotation || [],
        ipo_updates: (roverResult as any).ipo || []
      };

      res.json(context);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to construct market context', details: err.message });
    }
  });

  // API: Market-Rover Intelligence (FII/DII, Sector Rotation, IPOs)
  app.get('/api/market-rover/intelligence', async (req, res) => {
    try {
      const { spawn } = await import('child_process');
      const pythonProcess = spawn('python', ['market_rover_data.py']);

      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          return res.status(500).json({ error: 'Failed to fetch intelligence', details: error });
        }
        try {
          const intel = JSON.parse(output);
          res.json(intel);
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse intelligence', details: output });
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Server error triggering intelligence', details: err.message });
    }
  });

  // API: Next-Gen AI Reasoning Agent (Multi-Agent Orchestrator)
  app.post('/api/ai/agent', express.json(), async (req, res) => {
    console.log('--- NEXT-GEN AGENT TRIGGERED ---');
    try {
      const { prompt } = req.body;
      const { spawn } = await import('child_process');
      const pythonProcess = spawn('python', ['market_gpt_multi_agent.py']);
      pythonProcess.stdin.write(prompt);
      pythonProcess.stdin.end();
      
      let output = '';
      let error = '';
      pythonProcess.stdout.on('data', (d) => {
          output += d.toString();
          console.log(`[Agent Stream]: ${d.toString().slice(0, 50)}...`);
      });
      
      pythonProcess.stderr.on('data', (d) => {
          error += d.toString();
          console.error(`[Agent Internal Error]: ${d}`);
      });
      
      pythonProcess.on('close', (code) => {
        try {
          const result = JSON.parse(output.trim());
          console.log('--- AGENT SUCCESS ---');
          res.json({ 
             text: result.answer, 
             thinking: result.steps || [],
             sources: result.sources || []
          });
        } catch (e) {
          console.error('Agent Parse Fail. Raw Output:', output);
          console.error('Agent Stderr:', error);
          res.status(500).json({ error: 'Multi-Agent logic crash', details: error.slice(0, 200) });
        }
      });
    } catch (err: any) {
      console.error('Agent Trigger Fail:', err.message);
      res.status(500).json({ error: 'Agent trigger failed', details: err.message });
    }
  });

  app.get('/api/market/intelligence', async (req, res) => {
    try {
      const { spawn } = await import('child_process');
      const pythonProcess = spawn('python', ['market_intelligence_feeder.py']);
      
      let output = '';
      pythonProcess.stdout.on('data', (data) => output += data.toString());
      pythonProcess.on('close', (code) => {
        try {
          res.json(JSON.parse(output));
        } catch (e) {
          res.status(500).json({ error: 'Data parsing failed', details: output });
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error triggering intelligence feeder' });
    }
  });

  // API: Video Generation
  app.get('/api/video/generate', async (req, res) => {
    const { symbol, lang, fii, ipo, pattern } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

    try {
      const { spawn } = await import('child_process');
      const pythonProcess = spawn('python', [
        'video_generator.py',
        String(symbol).toUpperCase(),
        String(lang || 'en'),
        String(fii || 'true'),
        String(ipo || 'true'),
        String(pattern || 'true')
      ]);

      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`[VideoGen Output]: ${data}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
        console.error(`[VideoGen Error]: ${data}`);
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          return res.status(500).json({ error: 'Video generation failed', details: error });
        }

        const successMatch = output.match(/SUCCESS\|(.+)/);
        if (successMatch) {
          res.json({ url: successMatch[1].trim() });
        } else {
          res.status(500).json({ error: 'Could not parse video URL from generator output', details: output });
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Server error triggering generator', details: err.message });
    }
  });

  // API: Historical Data (Continue existing logic)
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    let pollInterval: NodeJS.Timeout | null = null;
    let currentSymbol: string | null = null;

    const fetchPrice = async (symbol: string) => {
      try {
        // Try Twelve Data real-time quote first
        let tdSymbol = symbol;
        if (!tdSymbol.includes(':')) tdSymbol = `${tdSymbol}:NSE`;

        try {
          const tdQuote = await axios.get(`https://api.twelvedata.com/quote?symbol=${tdSymbol}&apikey=${TWELVE_DATA_API_KEY}`);
          if (tdQuote.data && tdQuote.data.price) {
            const data = tdQuote.data;
            ws.send(JSON.stringify({
              type: 'ticks',
              data: [{
                last_price: parseFloat(data.price),
                change: parseFloat(data.percent_change) || 0,
                volume: parseInt(data.volume) || 0,
                timestamp: new Date()
              }]
            }));
            return;
          }
        } catch (e) {
          console.warn('Twelve Data real-time quote failed, trying Yahoo.');
        }

        // Fallback to Yahoo Finance polling
        let yfSymbol = symbol;
        if (!yfSymbol.includes('.')) yfSymbol = `${yfSymbol}.NS`;

        const quote = await yahooFinance.quote(yfSymbol) as any;
        ws.send(JSON.stringify({
          type: 'ticks',
          data: [{
            last_price: quote.regularMarketPrice,
            change: quote.regularMarketChangePercent,
            volume: quote.regularMarketVolume,
            timestamp: new Date()
          }]
        }));
      } catch (error: any) {
        console.error('Price Poll Error:', error.message);
      }
    };

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'subscribe' && data.symbol) {
          if (pollInterval) clearInterval(pollInterval);
          currentSymbol = data.symbol;

          // Initial fetch
          await fetchPrice(currentSymbol!);

          // Poll every 10 seconds (Yahoo Finance free tier friendly)
          pollInterval = setInterval(() => fetchPrice(currentSymbol!), 10000);

          ws.send(JSON.stringify({
            type: 'system',
            message: `Subscribed to live updates for ${currentSymbol} via Yahoo Finance.`
          }));
        }
      } catch (e) {
        console.error('WS Message Error:', e);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      if (pollInterval) clearInterval(pollInterval);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          port: 24678 + Math.floor(Math.random() * 1000)
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
