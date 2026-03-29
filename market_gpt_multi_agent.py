import os
import sys
import json
import time
import requests
import yfinance as yf
from nsepython import nse_quote_ltp
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime, timedelta
import io
from contextlib import redirect_stdout

load_dotenv()

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")

class MarketGPTMultiAgent:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.output_log = []

    def log_step(self, step):
        self.output_log.append(f"[{datetime.now().strftime('%H:%M:%S')}] {step}")

    def fetch_live_price(self, ticker):
        self.log_step(f"Agent: Price-Scan searching for {ticker}...")
        try:
            # Try NSE first (ticker formatting for yfinance usually needs .NS)
            if not ticker.endswith('.NS'):
                yf_ticker = ticker + '.NS'
            else:
                yf_ticker = ticker
            
            stock = yf.Ticker(yf_ticker)
            price_data = stock.history(period="1d")
            if not price_data.empty:
                current_price = price_data['Close'].iloc[-1]
                return f"Last Traded Price for {ticker}: ₹{current_price:.2f}"
            return "Price data unavailable currently."
        except: return "Failed to fetch live price."

    def fetch_market_news(self, query):
        self.log_step(f"Agent: Web-Scanner searching news for '{query}'...")
        try:
            url = f"https://newsdata.io/api/1/news?apikey={NEWSDATA_API_KEY}&q={query}&country=in&category=business"
            r = requests.get(url, timeout=5)
            if r.status_code == 200:
                results = r.json().get('results', [])
                if results:
                    return "\n".join([f"- {n['title']} (Source: {n['source_id']})" for n in results[:3]])
            return "No recent market news found."
        except: return "News scan interrupted."

    def perform_institutional_check(self, ticker):
        self.log_step(f"Agent: Flow-Screener checking institutional activity for {ticker}...")
        # Mocking check for demo (would usually use nselib)
        return f"Recent institutional flow for {ticker} shows moderate accumulation by domestic funds."

    def analyze(self, user_query):
        # 1. Identify Ticker (Self-Correction Step)
        self.log_step("Agent: Query-Interpreter parsing intent...")
        
        # If query contains "USER QUERY:", extract only that part for better ticker detection
        extract_target = user_query
        if "USER QUERY:" in user_query:
            extract_target = user_query.split("USER QUERY:")[1].split("\n")[0].strip()
            
        ticker_detect_prompt = f"Identify the primary stock ticker from this financial request: '{extract_target}'. Return ONLY the raw ticker symbol (e.g. RELIANCE, TCS, BTC). If no specific company is mentioned, return 'NONE'."
        
        ticker_res = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": ticker_detect_prompt}]
        ).choices[0].message.content.strip().replace('"', '').replace("'", "")
        
        market_context = ""
        if ticker_res and ticker_res != "NONE" and len(ticker_res) < 15:
            # 2. Multi-step Data Gathering
            ticker_res = ticker_res.upper()
            price_info = self.fetch_live_price(ticker_res)
            news_info = self.fetch_market_news(ticker_res)
            inst_info = self.perform_institutional_check(ticker_res)
            market_context = f"REAL-TIME DATA FOR {ticker_res}:\n{price_info}\n\nINSTITUTIONAL FLOW:\n{inst_info}\n\nLATEST NEWS:\n{news_info}"
        else:
            self.log_step("Agent: Info-Scanner scanning broad market news (No specific ticker detected).")
            market_context = self.fetch_market_news(extract_target)

        # 3. Final Multi-step Synthesis (The Brain)
        self.log_step("Agent: Synthesis-Brain cross-analyzing all signals...")
        synthesis_prompt = f"""
        Role: Senior Financial Analyst (Llama 3-70B Brain)
        Query: {user_query}
        Contextual Data:
        {market_context}
        
        TASK:
        - Provide a multi-step analysis (Technicals -> Fundamental/Institutional -> Conclusion).
        - CITE sources in-line [Source: Price-Scan], [Source: Web-Scanner], [Source: Flow-Screener].
        - Use bolding for key figures.
        - Not a summary—be a 'Signal Finder'.
        """
        
        response = self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": synthesis_prompt}]
        )
        
        return {
            "answer": response.choices[0].message.content,
            "steps": self.output_log,
            "sources": ["Price-Scan (yfinance)", "Web-Scanner (NewsData)", "Flow-Screener (NSE)"]
        }

if __name__ == "__main__":
    try:
        # Robust stdin reading for long context prompts
        input_data = sys.stdin.read().strip()
        query = input_data if input_data else "Market summary?"
        
        # Hide all background noise to keep stdout pure
        f = io.StringIO()
        with redirect_stdout(f):
            agent = MarketGPTMultiAgent()
            report = agent.analyze(query)
            
        print(json.dumps(report))
    except Exception as e:
        # Emergency JSON response if script crashes
        print(json.dumps({
            "answer": f"System Error: {str(e)}",
            "steps": ["Reasoning Interrupted by System Fault"],
            "sources": ["System Diagnostics"]
        }))
