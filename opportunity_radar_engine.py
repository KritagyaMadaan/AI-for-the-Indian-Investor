import sys
import os
import json
import time
import requests
import io
from contextlib import redirect_stdout

# Aggressive Silence: Redirect ALL current stdout to stderr instantly
# Store the original stdout for the final report
original_stdout = sys.stdout
sys.stdout = sys.stderr

from nsepython import nse_quote_ltp
# nselib capital market functions might have different names in this version
import nselib.capital_market as cm
from groq import Groq
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")

class OpportunityRadarEngine:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)

    def fetch_bulk_deals(self):
        try:
            # Common names in nselib: bulk_deal_data or bulk_deals
            if hasattr(cm, 'bulk_deal_data'):
                data = cm.bulk_deal_data(period="1D")
            elif hasattr(cm, 'bulk_deals'):
                data = cm.bulk_deals(period="1D")
            else:
                return []
            return data.tail(10).to_dict('records') if not data.empty else []
        except: return []

    def fetch_insider_trades(self):
        try:
            # Common names: insider_trading_data or insider_trading
            if hasattr(cm, 'insider_trading_data'):
                data = cm.insider_trading_data(period="1D")
            elif hasattr(cm, 'insider_trading'):
                data = cm.insider_trading(period="1D")
            else:
                return []
            return data.tail(10).to_dict('records') if not data.empty else []
        except: return []

    def fetch_corporate_filings(self):
        try:
            # Common names: announcement_data or announcements
            if hasattr(cm, 'announcement_data'):
                data = cm.announcement_data(period="1D")
            elif hasattr(cm, 'announcements'):
                data = cm.announcements(period="1D")
            else:
                return []
            return data.tail(15).to_dict('records') if not data.empty else []
        except: return []

    def fetch_regulatory_news(self):
        try:
            # News fallback to NewsData.io
            url = f"https://newsdata.io/api/1/news?apikey={NEWSDATA_API_KEY}&q=NSE India&country=in&category=business"
            r = requests.get(url, timeout=5)
            if r.status_code == 200:
                results = r.json().get('results', [])
                # Normalize results
                return [{"title": n.get('title'), "link": n.get('link')} for n in results[:10]]
        except: pass
        return []

    def run_signal_brain(self, raw_data):
        # Flatten data for prompt
        bulk = raw_data.get('bulk_deals', [])
        insider = raw_data.get('insider_trades', [])
        filings = raw_data.get('filings', [])
        news = raw_data.get('news', [])
        
        prompt = f"""
        You are a high-performance Opportunity Finder for an institutional trading desk. 
        Your mission is to find ACTIONABLE TRADING SIGNALS (not summaries) based on Indian Market Data:
        
        DATA:
        - CORPORATE FILINGS / RESULTS: {json.dumps(filings)[:800]}
        - BULK/BLOCK DEALS: {json.dumps(bulk)[:800]}
        - INSIDER TRADES: {json.dumps(insider)[:800]}
        - REGULATORY NEWS / POLICY: {json.dumps(news)[:800]}
        
        TASK:
        1. Identify 5-8 HIGH CONVICTION alerts.
        2. Detect "Management Commentary Shifts" and "Institutional Conviction".
        
        OUTPUT (JSON Format):
        Return ONLY a JSON object with a "signals" key containing an array of Signal objects.
        Each signal MUST have:
        - Symbol: (NSE Ticker)
        - "Signal Type": (e.g., "Promoter Buying + Earnings Beat")
        - "Conviction Score": (0-100)
        - Reasoning: (Detailed institutional logic)
        - Impact: (Short/Medium/Long Term)
        - "Source Info": (Exact proof/deal row from the DATA)
        - "Source Link": (Direct URL of news, filing, or report if available)
        - "Source Category": (One of: 'News Report', 'Exchange Filing', 'SEBI Filing', 'Bulk Deal Row')
        """
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            
            # 1. Clean Markdown
            if "```json" in content:
                content = content.split("```json")[-1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[-1].split("```")[0]
            
            data = json.loads(content.strip())
            
            # 2. Extract and Normalize signals
            signals = []
            if isinstance(data, list): signals = data
            elif isinstance(data, dict):
                signals = data.get("signals", data.get("Signals", []))
            
            # Normalize scores (Ensuring 0-100% instead of 0.0-1.0)
            for s in signals:
                if isinstance(s, dict) and "Conviction Score" in s:
                    score = s["Conviction Score"]
                    # If score is a float 0.0-1.0, convert to %
                    if isinstance(score, (int, float)) and score > 0 and score <= 1:
                        s["Conviction Score"] = int(score * 100)
                    # If score is a string "85%", strip %
                    elif isinstance(score, str) and "%" in score:
                        s["Conviction Score"] = int(score.replace("%", ""))
            
            return signals
        except Exception as e:
            # Final safety: Log and return empty so dashboard doesn't crash
            print(f"Signal Brain Error: {e}", file=sys.stderr)
            return []

    def generate(self):
        raw_data = {
            "bulk_deals": self.fetch_bulk_deals(),
            "insider_trades": self.fetch_insider_trades(),
            "filings": self.fetch_corporate_filings(),
            "news": self.fetch_regulatory_news()
        }
        signals = self.run_signal_brain(raw_data)
        
        # Calculate real-time sentiment based on signal quality
        scores = [s.get('Conviction Score', 0) for s in signals if isinstance(s, dict)]
        avg_score = sum(scores) / len(scores) if scores else 50
        
        sentiment = "Neutral"
        if avg_score > 75: sentiment = "Very Bullish"
        elif avg_score > 60: sentiment = "Bullish"
        elif avg_score < 40: sentiment = "Bearish"

        return {
            "timestamp": datetime.now().isoformat(), 
            "signals": signals,
            "sentiment": sentiment,
            "counts": {
                "bulk": len(raw_data['bulk_deals']),
                "insider": len(raw_data['insider_trades']),
                "filings": len(raw_data['filings']),
                "news": len(raw_data['news'])
            }
        }

if __name__ == "__main__":
    try:
        engine = OpportunityRadarEngine()
        report = engine.generate()
        # SUCCESS: Final output to pure original stdout
        print(json.dumps(report), file=original_stdout)
    except Exception as e:
        # FAIL: Always return valid empty JSON even on crash
        print(json.dumps({"signals": [], "error": str(e)}), file=original_stdout)
