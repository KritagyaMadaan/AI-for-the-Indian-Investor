<div align="center">

<!-- Banner -->
<img src="https://private-user-images.githubusercontent.com/159876365/477138731-0aa67016-6eaf-458a-adb2-6e31a0763ed6.png" alt="AI for the Indian Investor Banner" width="100%"/>

<br/>

# 🇮🇳 AI for the Indian Investor

### *Your AI-Powered Market Intelligence Terminal — Built for the Indian Stock Market*

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-80.6%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-17.6%25-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Groq](https://img.shields.io/badge/Groq-LLaMA%203.3--70B-FF6B35?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)
[![NSE](https://img.shields.io/badge/NSE-Live%20Data-006400?style=for-the-badge)](https://www.nseindia.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

[🚀 Live Demo](https://ai.studio/apps/2b751ac1-c1b4-4048-ade7-26f715cbc3a8) · [📂 View Code](https://github.com/KritagyaMadaan/AI-for-the-Indian-Investor) · [🐛 Report Bug](https://github.com/KritagyaMadaan/AI-for-the-Indian-Investor/issues)

</div>

---

## 📌 What is This?

**AI for the Indian Investor** is a full-stack, AI-powered market intelligence platform purpose-built for **NSE/BSE investors**. It combines a real-time React/TypeScript frontend with a Python multi-agent backend that ingests live NSE data, financial news, institutional activity, and insider trades — then synthesizes it all using **LLaMA 3.3-70B (via Groq)** to surface actionable trading signals.

Think of it as a **Bloomberg Terminal meets ChatGPT**, tuned for the Indian market.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Multi-Agent AI Brain** | Specialized agents (`Price-Scan`, `Web-Scanner`, `Flow-Screener`) work in parallel to gather and cross-validate signals |
| 📡 **Live NSE/BSE Prices** | Real-time LTP (Last Traded Price) via `yfinance` + `nsepython` for any NSE-listed stock |
| 📰 **AI News Analysis** | Fetches and contextualizes latest Indian market news via NewsData.io |
| 🔍 **Opportunity Radar Engine** | Scans bulk/block deals, insider trades, corporate filings, and SEBI/NSE announcements |
| 🎯 **High-Conviction Signal Finder** | Generates 5–8 scored trading signals (0–100 conviction) with full institutional reasoning |
| 📈 **Chart Pattern Intelligence** | Candlestick (25d, `mplfinance`) + live 5-min heartbeat graph (`plotly`) — detects Doji, Engulfing, Inside Bar patterns |
| 🎬 **AI Video Broadcast Studio** | Full 5-stage pipeline: data fetch → chart render → LLaMA script → neural TTS → `moviepy` assembly → `.mp4` output |
| 🏦 **FII/DII & IPO Feeder** | Live institutional flow data and recent NSE listings injected as context into video narrations |
| 💬 **Natural Language Queries** | Ask anything: *"Should I buy Reliance?"* or *"What's happening with NIFTY 50?"* |
| 📊 **Market Sentiment Engine** | Real-time sentiment scoring: Very Bullish / Bullish / Neutral / Bearish |

---

## 🏗️ Architecture

The system is organised into four layers. Each layer communicates strictly downward — the frontend talks only to the TypeScript server, and the server spawns Python subprocesses that talk only to external APIs.

```
Layer 1 · React + TypeScript Frontend (Vite)
  ├── Stock Search & Live Price      WebSocket (live ticks)
  ├── MarketGPT Chat                 POST /api/ai/agent
  ├── Opportunity Radar Dashboard    GET  /api/radar/advanced
  └── AI Market Video Engine         GET  /api/video/generate

          ↕  REST API · WebSocket

Layer 2 · TypeScript Backend (server.ts · Node.js + Express)
  ├── WebSocket Price Streamer       Twelve Data (primary) → Yahoo Finance (fallback) · 10s poll
  ├── REST API Router                /stock/search · /market/history · /market/patterns
  │                                  /radar/raw-data · /news · /chat/intel
  │                                  /market-rover/intelligence · /video/generate
  └── Pattern Detection Engine       Golden Cross · Death Cross · Resistance Breakout
                                     Support Breakdown · 1d/7d/30d outcome stats

          ↕  spawn() Python subprocesses

Layer 3 · Python AI Engines
  ├── MarketGPT Multi-Agent          market_gpt_multi_agent.py
  ├── Opportunity Radar Engine       opportunity_radar_engine.py
  ├── Market Intelligence Feeder     market_intelligence_feeder.py
  └── AI Market Video Engine         video_generator.py

          ↕  External APIs & AI

Layer 4 · Data Sources & AI
  ├── LLaMA 3.3-70B                  Groq inference API
  ├── NSE / BSE                      nselib · nsepython · yfinance
  ├── Twelve Data                    OHLCV · real-time quotes
  ├── NewsData.io                    country=in · category=business
  └── Pexels + edge-tts              Motion backgrounds · Microsoft Neural TTS
```

### AI Market Video Engine — 5-Stage Pipeline

The most complex module — a fully automated broadcast pipeline that produces a narrated `.mp4` market recap for any NSE ticker in under 60 seconds.

| Stage | Name | What it does |
|---|---|---|
| 1 | **Data Fetcher** | `yfinance`: 3mo daily OHLCV for charting + 5m intraday bars for live heartbeat; resolves aliases (`NIFTY 50` → `^NSEI`) |
| 2 | **Chart Pattern Intelligence** | `plotly` dark: 5m intraday momentum graph (always on) · `mplfinance` Charles style: 25d candlestick + volume bars (`--pattern` flag) |
| 3 | **AI Script Writer** | `LLaMA 3.3-70B` via Groq: 35-second script (70–80 words), EN or HI; `--fii`, `--ipo`, `--pattern` flags inject live market context |
| 4 | **Neural TTS Narration** | `edge-tts`: `en-US-AriaNeural` (English) · `hi-IN-SwaraNeural` (Hindi); async `.mp3` export |
| 5 | **Video Assembly** | `moviepy` @ 24fps: Pexels motion BG + `Pillow` header/ticker overlays + chart clips with FadeIn/FadeOut → `{SYMBOL}_custom_news.mp4` |

### Pattern Detection Engine — Built into server.ts

Four patterns detected over 2 years of daily OHLCV, with forward performance tracking:

| Pattern | Trigger | Type |
|---|---|---|
| Golden Cross | SMA-50 crosses above SMA-200 | Bullish |
| Death Cross | SMA-50 crosses below SMA-200 | Bearish |
| Resistance Breakout | Price exceeds 20-day high | Bullish |
| Support Breakdown | Price falls below 20-day low | Bearish |

Each detected pattern is tagged with 1d, 7d, and 30d forward price changes, and a 7-day success rate is computed per pattern type across all historical instances.

---

## 🧠 AI Agents

### `MarketGPTMultiAgent` — Stock Query Brain
Located in `market_gpt_multi_agent.py`. Handles natural-language investor queries end-to-end:

1. **Query-Interpreter** — Extracts the target ticker using LLaMA 3.3-70B
2. **Price-Scan** — Fetches live LTP from NSE via yfinance
3. **Web-Scanner** — Pulls latest news from NewsData.io (country=in, category=business)
4. **Flow-Screener** — Checks institutional accumulation/distribution patterns
5. **Synthesis-Brain** — Cross-analyzes all signals and returns a structured analyst report with cited sources

### `OpportunityRadarEngine` — Autonomous Market Scanner
Located in `opportunity_radar_engine.py`. Runs unprompted to surface hidden opportunities:

- Scrapes **bulk/block deals**, **insider trades**, and **corporate announcements** from NSE via `nselib`
- Fetches regulatory news as a fallback from NewsData.io
- Passes everything to LLaMA 3.3-70B which outputs **5–8 JSON-structured trading signals** with:
  - Conviction Score (0–100)
  - Signal Type (e.g., *"Promoter Buying + Earnings Beat"*)
  - Short/Medium/Long-term Impact
  - Source citations (Exchange Filing, Bulk Deal Row, SEBI Filing, News Report)

### `VideoGenerator` — Market Broadcast Studio
Located in `video_generator.py`. The most visually impressive module — a fully automated, AI-narrated video broadcast pipeline that produces a polished `.mp4` market recap for any NSE ticker in under 60 seconds. Here's how the 5-stage pipeline works:

**Stage 1 — Data Fetcher**
Downloads two data streams simultaneously via `yfinance`: 3 months of daily OHLCV (for charting) and real-time 5-minute intraday bars (for the live heartbeat graph). Also resolves common ticker aliases (e.g., `NIFTY 50` → `^NSEI`).

**Stage 2 — Chart Pattern Intelligence**
This is where technical analysis becomes visual. Two chart types are generated conditionally based on user-selected intelligence flags:

| Flag | Chart | Library | Detail |
|---|---|---|---|
| Always on | **Live Heartbeat / Momentum** | `plotly` (dark theme) | 5-min intraday closing price as a glowing blue line — shows same-day momentum at a glance |
| `--pattern=true` | **Candlestick + Volume** | `mplfinance` | Last 25 trading days rendered in `charles` style with volume bars — surfaces patterns like Doji, Engulfing, Inside Bar |

Both charts are exported as high-resolution `.png` assets for video compositing.

**Stage 3 — AI Script Writer**
Calls `LLaMA 3.3-70B` (via Groq) with the live price and three optional context flags to write a tight 35-second (70–80 word) broadcast script:
- `--fii=true` → injects Net FII/DII flow sentiment into the script
- `--ipo=true` → references recent NSE listing activity
- `--pattern=true` → instructs the LLM to comment on technical structure and candle patterns

Supports both **English** and **Hindi** (language flag passed as CLI arg).

**Stage 4 — Neural TTS Narration**
Uses `edge-tts` (Microsoft Neural TTS, free) to convert the AI script to broadcast-quality audio:
- 🇬🇧 English → `en-US-AriaNeural`
- 🇮🇳 Hindi → `hi-IN-SwaraNeural`

**Stage 5 — Video Assembly**
`moviepy` composites the final `.mp4` at 24fps:
- **Background**: Pexels API fetches a live motion video (trading floor / finance city / data analytics) — falls back to a dark `#09090B` base if unavailable
- **Chart clips**: Momentum graph plays for the first half, candlestick (if enabled) fades in for the second half — both with FadeIn/FadeOut transitions
- **Text overlays**: `Pillow` renders two persistent overlay bars — a header (`MARKET SENTINEL AI BROADCAST`) and a live ticker strip at the bottom
- **Output**: `{SYMBOL}_custom_news.mp4` saved to `/public/generated_videos/` and served directly by the TypeScript backend

### `MarketIntelligenceFeeder` — FII/DII & IPO Data Pipeline
Located in `market_intelligence_feeder.py`. A lightweight but critical data module that pipes two live feeds from NSE into the broader system:

- **FII/DII Trading Activity** — last 5 days of net foreign and domestic institutional flows via `nselib.capital_market`
- **IPO Tracker** — recent NSE equity listings pulled from the live equity list

This data is injected as context into the `VideoGenerator`'s AI script (via the `--fii` and `--ipo` flags) to ensure narrated videos reflect the actual institutional climate, not just price action.

---

## 🗂️ Project Structure

```
AI-for-the-Indian-Investor/
│
├── src/                          # React/TypeScript frontend source
├── public/                       # Static assets
│
├── market_gpt_multi_agent.py     # Multi-agent AI query engine
├── opportunity_radar_engine.py   # Autonomous opportunity scanner
├── market_intelligence_feeder.py # Data pipeline / feeder
├── market_rover_data.py          # Market data rover
├── video_generator.py            # Auto video report generator
│
├── server.ts                     # TypeScript backend API server
├── vite.config.ts                # Vite build config
├── index.html                    # App entry point
│
├── models_output.json            # Cached model outputs
├── metadata.json                 # App metadata
├── requirements.txt              # Python dependencies
├── package.json                  # Node dependencies
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Python** 3.9+
- A [Groq API Key](https://console.groq.com/) (free tier available)
- A [NewsData.io API Key](https://newsdata.io/) (free tier available)

---

### 1. Clone the Repository

```bash
git clone https://github.com/KritagyaMadaan/AI-for-the-Indian-Investor.git
cd AI-for-the-Indian-Investor
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
NEWSDATA_API_KEY=your_newsdata_api_key_here
PEXELS_API_KEY=your_pexels_api_key_here
```

### 3. Install Frontend Dependencies

```bash
npm install
```

### 4. Install Python Dependencies

```bash
pip install -r requirements.txt
```

> **Note for Windows users:** `pywin32` is required. On Linux/macOS, you may safely remove it from `requirements.txt`.

### 5. Run the App

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in your terminal).

---

### Running Python Agents Standalone

**MarketGPT Multi-Agent** (for a specific stock query):
```bash
echo "Should I buy TCS right now?" | python market_gpt_multi_agent.py
```

**Opportunity Radar Engine** (autonomous market scan):
```bash
python opportunity_radar_engine.py
```

**Video Generator** (produce a narrated `.mp4` broadcast for any ticker):
```bash
# python video_generator.py <SYMBOL> <LANGUAGE> <FII_FLAG> <IPO_FLAG> <PATTERN_FLAG>
python video_generator.py RELIANCE en true true true   # English, all intelligence on
python video_generator.py "NIFTY 50" hi true false true  # Hindi, FII + patterns only
```

Both query scripts output clean JSON to stdout, suitable for piping into the TypeScript backend.

---

## 📦 Tech Stack

**Frontend**
- React + TypeScript (Vite)
- Tailwind CSS

**Backend (TypeScript)**
- Node.js / Express (`server.ts`)
- Spawns Python subprocesses for AI agents

**AI / ML (Python)**
- `groq` — LLaMA 3.3-70B inference (ultra-fast)
- `google-generativeai` — Gemini API integration
- `yfinance` — NSE/BSE stock price data (daily OHLCV + 5m intraday)
- `nsepython` + `nselib` — NSE market data (bulk deals, insider trades, filings, FII/DII)
- `mplfinance` — Candlestick chart generation (25d, Charles style + volume)
- `plotly` — Live intraday momentum/heartbeat graph
- `edge-tts` — Microsoft Neural TTS (`AriaNeural` EN, `SwaraNeural` HI)
- `moviepy` — Video assembly, clip compositing, fade effects @ 24fps
- `Pillow` — Text overlay rendering for video broadcast bars
- `matplotlib` — Additional chart rendering
- `pandas` / `numpy` — Data processing

---

## 🔑 API Keys Required

| Service | Purpose | Free Tier |
|---|---|---|
| [Groq](https://console.groq.com/) | LLaMA 3.3-70B inference | ✅ Yes |
| [NewsData.io](https://newsdata.io/) | Indian market news feed | ✅ Yes |
| [Google AI Studio](https://aistudio.google.com/) | Gemini API (frontend) | ✅ Yes |
| [Pexels](https://www.pexels.com/api/) | Motion video backgrounds for broadcast | ✅ Yes |

---

## 📸 Sample Output

**MarketGPT Query Response:**
```json
{
  "answer": "**RELIANCE Analysis:**\n\n[Source: Price-Scan] Last Traded Price: ₹1,284.50...",
  "steps": [
    "[14:32:01] Agent: Query-Interpreter parsing intent...",
    "[14:32:02] Agent: Price-Scan searching for RELIANCE...",
    "[14:32:03] Agent: Web-Scanner searching news for 'RELIANCE'...",
    "[14:32:04] Agent: Synthesis-Brain cross-analyzing all signals..."
  ],
  "sources": ["Price-Scan (yfinance)", "Web-Scanner (NewsData)", "Flow-Screener (NSE)"]
}
```

**Opportunity Radar Signal:**
```json
{
  "Symbol": "TITAN",
  "Signal Type": "Promoter Buying + Earnings Beat",
  "Conviction Score": 82,
  "Reasoning": "Tata Sons increased stake by 1.2% post Q3 results...",
  "Impact": "Medium Term",
  "Source Category": "Exchange Filing"
}
```

---

## ⚠️ Disclaimer

> This project is built for **educational and research purposes only**. The AI-generated signals, analyses, and recommendations are **not financial advice**. Always consult a SEBI-registered financial advisor before making investment decisions. Past signals do not guarantee future performance.

---

## 🤝 Contributing

Contributions are welcome! Here's how to get involved:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ for the Indian Investor  
by [Kritagya Madaan](https://github.com/KritagyaMadaan)

⭐ **Star this repo** if you found it useful!

</div>
