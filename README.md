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
| 🎬 **Video Report Generator** | Auto-generates market recap videos with charts, TTS narration, and animated visuals |
| 💬 **Natural Language Queries** | Ask anything: *"Should I buy Reliance?"* or *"What's happening with NIFTY 50?"* |
| 📊 **Market Sentiment Engine** | Real-time sentiment scoring: Very Bullish / Bullish / Neutral / Bearish |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│             React + TypeScript Frontend          │
│           (Vite · index.html · /src · /public)   │
└──────────────────────┬──────────────────────────┘
                       │ API calls
                       ▼
┌─────────────────────────────────────────────────┐
│              TypeScript Backend Server           │
│                    (server.ts)                   │
└──────┬─────────────────────────┬────────────────┘
       │                         │
       ▼                         ▼
┌──────────────┐        ┌────────────────────────┐
│  MarketGPT   │        │  OpportunityRadar       │
│  Multi-Agent │        │  Engine                 │
│  (Python)    │        │  (Python)               │
│              │        │                         │
│ ┌──────────┐ │        │ ┌─────────┐ ┌────────┐ │
│ │Price-Scan│ │        │ │ Bulk /  │ │Insider │ │
│ │(yfinance)│ │        │ │ Block   │ │ Trades │ │
│ └──────────┘ │        │ │ Deals   │ └────────┘ │
│ ┌──────────┐ │        │ └─────────┘ ┌────────┐ │
│ │Web-Scanner│ │        │ ┌─────────┐ │Filings │ │
│ │(NewsData) │ │        │ │ NSE     │ │& News  │ │
│ └──────────┘ │        │ │ nselib  │ └────────┘ │
│ ┌──────────┐ │        │ └─────────┘            │
│ │Flow-      │ │        └───────────┬────────────┘
│ │Screener   │ │                    │
│ └──────────┘ │        ┌────────────▼────────────┐
└──────┬───────┘        │   LLaMA 3.3-70B (Groq)  │
       └────────────────►   Signal Synthesis Brain │
                        └─────────────────────────┘
```

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

### `VideoGenerator` — Market Recap Filmmaker
Located in `video_generator.py`. Auto-creates shareable video reports using:
- `matplotlib` / `mplfinance` — candlestick charts
- `gTTS` / `pyttsx3` — text-to-speech narration
- `moviepy` — video assembly & export

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

Both scripts output clean JSON to stdout, suitable for piping into the TypeScript backend.

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
- `yfinance` — NSE/BSE stock price data
- `nsepython` + `nselib` — NSE market data (bulk deals, insider trades, filings)
- `gTTS` / `pyttsx3` — Text-to-speech for video generation
- `moviepy` — Video creation
- `mplfinance` / `plotly` / `matplotlib` — Chart generation
- `pandas` / `numpy` — Data processing

---

## 🔑 API Keys Required

| Service | Purpose | Free Tier |
|---|---|---|
| [Groq](https://console.groq.com/) | LLaMA 3.3-70B inference | ✅ Yes |
| [NewsData.io](https://newsdata.io/) | Indian market news feed | ✅ Yes |
| [Google AI Studio](https://aistudio.google.com/) | Gemini API (frontend) | ✅ Yes |

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
