import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const architectureMarkdown = `
# AI-Powered Financial Intelligence Platform Architecture

This document outlines the production-ready architecture for the Indian Stock Market (NSE/BSE) AI Intelligence Platform.

## 1. Complete System Architecture

The system is designed for high-throughput, low-latency (< 3 sec) processing of tick data and asynchronous processing of fundamental filings.

*   **Frontend (Client):** React 18 (Vite), Tailwind CSS, Recharts, Zustand. Connects via WebSockets for real-time updates.
*   **API Gateway & WS Manager:** Node.js (Express) + \`ws\`. Handles client connections, authentication, and routing.
*   **Data Ingestion Layer:**
    *   *Tick Data:* Go/Rust worker connecting to Zerodha Kite Connect WebSocket (\`wss://ws.kite.trade/\`). Pushes to Redis Streams.
    *   *Fundamental Data:* Python Celery workers scraping/polling NSE/BSE APIs and Screener.in.
*   **Quant Engine:** Python (FastAPI) + Pandas + TA-Lib. Subscribes to Redis Streams, calculates real-time indicators (RSI, MACD, Bollinger Bands), and publishes signals back to Redis.
*   **AI Agent Engine:** Python + LangGraph + Gemini 3.1 Pro. Multi-agent system for complex reasoning, RAG on filings, and video script generation.
*   **Video Engine:** Remotion (React-based programmatic video) + Gemini Flash (TTS and Asset Generation).

## 2. Exact APIs Used

*   **Market Data (Real-time & Historical):**
    *   *Zerodha Kite Connect API:* \`wss://ws.kite.trade/\` (Live ticks), \`/instruments\` (Master data), \`/quote\` (Snapshots).
    *   *Alternative:* Upstox API (\`wss://api.upstox.com/v2/feed/market-data-feed\`).
*   **Fundamentals & Corporate Filings:**
    *   *NSE India Official:* \`https://www.nseindia.com/api/corporates-announcements\` (Announcements), \`https://www.nseindia.com/api/block-deal\` (Block deals).
    *   *BSE India Official:* \`https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w\` (Announcements).
*   **News & Sentiment:**
    *   *NewsAPI:* \`/v2/everything?domains=moneycontrol.com,economictimes.indiatimes.com,livemint.com\`
    *   *GDELT Project:* For global macro events affecting Indian markets.
*   **Technical Indicators:**
    *   *TA-Lib (Python):* Computed locally on the server using incoming Kite Connect tick data. No external API needed for indicators.

## 3. Data Pipeline

1.  **Real-time Ingestion:** Zerodha Kite WS -> Go Worker -> Redis Pub/Sub (Topic: \`ticks.RELIANCE\`).
2.  **Quant Processing:** Python TA-Lib Worker subscribes to \`ticks.*\`. Aggregates 1m/5m/15m candles. Detects Breakout/RSI divergence -> Publishes to \`signals.tech\`.
3.  **Fundamental Ingestion:** Python Cron Job (every 1 min) -> NSE API -> Raw PDF/Text -> Gemini 3.1 Flash (Extraction) -> Publishes to \`signals.fund\`.
4.  **AI Synthesis:** Supervisor Agent receives signals -> Triggers Market ChatGPT -> Stores in Postgres -> Pushes to Node.js WS Gateway -> React Client.

## 4. Agent Architecture (LangGraph/AutoGen)

*   **Supervisor Agent:** The orchestrator. Receives user queries (e.g., "Analyze RELIANCE") and routes tasks to sub-agents.
*   **Quant Agent:** Interfaces with the TimescaleDB and TA-Lib engine. Backtests patterns on the fly.
*   **Fundamental Agent:** Uses RAG (Retrieval-Augmented Generation) over a Vector DB containing NSE annual reports and quarterly results.
*   **Risk Agent:** Evaluates the user's connected portfolio (via Zerodha API) to calculate beta, sector exposure, and position sizing recommendations.
*   **Synthesizer Agent (Gemini 3.1 Pro):** Combines outputs from Quant, Fundamental, and Risk agents into a cohesive, cited, simple-English response.

## 5. Database Design

*   **PostgreSQL (Relational):**
    *   \`users\` (id, zerodha_api_key, risk_profile)
    *   \`portfolios\` (user_id, symbol, quantity, avg_price)
    *   \`alerts\` (id, user_id, symbol, signal_type, confidence, created_at)
*   **TimescaleDB (Time-Series):**
    *   \`market_data\` (time, symbol, open, high, low, close, volume, vwap)
*   **Milvus / pgvector (Vector):**
    *   \`filings_embeddings\` (id, symbol, chunk_text, embedding, source_url, date)
*   **Redis (In-Memory):**
    *   Active WebSocket sessions, real-time tick cache, rate limiting.

## 6. Example Real-Time Workflow

**User Asks:** *"Should I buy RELIANCE?"*

1.  **Routing:** Supervisor Agent receives the query via WebSocket.
2.  **Data Gathering (Parallel):**
    *   *Quant Agent:* Fetches live Kite data. Calculates RSI = 32 (Approaching oversold), MACD shows bullish crossover on 15m chart.
    *   *Fundamental Agent:* Queries pgvector. Finds an NSE filing from 2 hours ago: "Reliance Jio announces new tariff hike" (Positive sentiment).
    *   *News Agent:* Fetches NewsAPI. "FIIs net buyers in Reliance today."
    *   *Risk Agent:* Checks user portfolio. User has 0% exposure to Energy.
3.  **Synthesis:** Gemini 3.1 Pro processes all context.
4.  **Output:** Generates response: *"Based on real-time data, RELIANCE shows a strong buying opportunity (Confidence: 85%). Technicals indicate a bullish MACD crossover with RSI at 32. Fundamentally, a recent NSE filing confirms a Jio tariff hike, which historically boosts revenue. Your portfolio has room for Energy sector exposure. [Source: NSE Corporate Announcements, Zerodha Live Ticks]"*

## 7. Deployment Plan (Production-Ready)

*   **Cloud Provider:** AWS or GCP (Mumbai Region for lowest latency to NSE/BSE colocation).
*   **Containerization:** Dockerized microservices orchestrated via Kubernetes (EKS/GKE).
*   **Managed Services:**
    *   Amazon RDS for PostgreSQL.
    *   Amazon ElastiCache for Redis.
    *   Pinecone or managed Milvus for Vector DB.
*   **CI/CD:** GitHub Actions -> Docker Build -> ArgoCD -> EKS.
*   **Monitoring:** Prometheus + Grafana for latency tracking, Datadog for APM.

## 8. MVP Roadmap (7-Day Hackathon Build)

*   **Day 1: Infrastructure & Market Data.** Set up Node.js + React boilerplate. Integrate Zerodha Kite Connect WebSocket. Store ticks in Redis.
*   **Day 2: Quant Engine.** Build Python FastAPI service. Implement TA-Lib for RSI, MACD, and simple Breakout detection.
*   **Day 3: Fundamental Scraper.** Build NSE Corporate Announcements scraper. Use Gemini Flash to extract structured JSON from filings.
*   **Day 4: AI Agents.** Set up LangChain. Create the Supervisor, Quant, and Fundamental agents. Connect them to the data sources.
*   **Day 5: Market ChatGPT UI.** Build the chat interface in React. Implement WebSocket streaming for the agent's thought process and final answer.
*   **Day 6: Video Engine.** Integrate Remotion. Create a template that takes the Agent's summary and generates a 30-second MP4 with TTS and charts.
*   **Day 7: Polish & Launch.** Optimize latency (< 3s goal). Add error handling for API rate limits. Deploy to Vercel (Frontend) and Render/Railway (Backend).
`;

export function Architecture() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">System Architecture</h1>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
          Production Ready
        </div>
      </div>
      <Card className="bg-zinc-950/50 border-zinc-800/50">
        <CardContent className="p-8 prose prose-invert prose-zinc max-w-none">
          <div className="markdown-body">
            <ReactMarkdown>{architectureMarkdown}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
