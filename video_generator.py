import sys
import os
import asyncio
import io
import random
from datetime import datetime
import yfinance as yf
from groq import Groq
import pandas as pd
from dotenv import load_dotenv
from moviepy import AudioFileClip, ImageClip, ColorClip, CompositeVideoClip, VideoFileClip, vfx
from nselib import capital_market
import edge_tts
import plotly.express as px
import mplfinance as mpf
from PIL import Image, ImageDraw, ImageFont
import requests

# Force UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
OUT_DIR = os.path.join(os.getcwd(), "public", "generated_videos")
os.makedirs(OUT_DIR, exist_ok=True)

class VideoGenerator:
    def __init__(self, symbol, language="en"):
        self.symbol = symbol
        self.language = language
        self.client = Groq(api_key=GROQ_API_KEY)
        self.video_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.asset_dir = os.path.join(OUT_DIR, self.video_id)
        os.makedirs(self.asset_dir, exist_ok=True)

    def fetch_data(self):
        print(f"Fetching data for {self.symbol}...")
        yf_mapping = {"NIFTY 50": "^NSEI", "RELIANCE": "RELIANCE.NS"}
        yf_symbol = yf_mapping.get(self.symbol, f"{self.symbol}.NS")

        try:
            # 1. Historical 3mo data for tech analysis
            hist = yf.download(yf_symbol, period="3mo", interval="1d", auto_adjust=True)
            if hist.empty: raise ValueError("Data Empty")
            
            # 2. NEW: Intraday 1d data for REAL-TIME momentum graph (5m intervals)
            hist_intraday = yf.download(yf_symbol, period="1d", interval="5m", auto_adjust=True)
            if isinstance(hist_intraday.columns, pd.MultiIndex): 
                hist_intraday.columns = hist_intraday.columns.get_level_values(0)
            
            if isinstance(hist.columns, pd.MultiIndex):
                hist.columns = hist.columns.get_level_values(0)
            
            # Ensure strictly float data
            hist = hist.astype(float).dropna()
            hist_intraday = hist_intraday.astype(float).dropna()
            
            # Safe float conversion for LTP
            last_close = hist['Close'].iloc[-1]
            ltp = float(last_close.iloc[0]) if hasattr(last_close, 'iloc') else float(last_close)

            return {
                "ltp": ltp,
                "history": hist,
                "intraday": hist_intraday,
                "token": self.symbol
            }
        except Exception as e:
            print(f"Data Fetch Fail: {e}")
            return None

    def fetch_motion_background(self):
        print("Fetching Premium Motion Background from Pexels...")
        if not PEXELS_API_KEY: return None
        try:
            headers = {"Authorization": PEXELS_API_KEY}
            queries = ["trading floor", "data analytics", "finance city", "stock market chart"]
            url = f"https://api.pexels.com/v1/videos/search?query={random.choice(queries)}&per_page=1&orientation=landscape"
            r = requests.get(url, headers=headers)
            video_url = r.json()["videos"][0]["video_files"][0]["link"]
            video_path = os.path.join(self.asset_dir, "bg_motion.mp4")
            with open(video_path, "wb") as f: f.write(requests.get(video_url).content)
            return video_path
        except: return None

    def generate_script(self, data, flags):
        print(f"Scripting via Llama 3 (Flags: {flags})...")
        context = []
        if flags.get('fii') == 'true': context.append("Include Net FII/DII flow sentiment.")
        if flags.get('ipo') == 'true': context.append("Mention recent IPO listing activity.")
        if flags.get('pattern') == 'true': context.append("Analyze technical structure and candle patterns.")
        
        prompt = f"Write a 35-second news script for {data['token']}. Price: ₹{data['ltp']}. Context: {' '.join(context)}. LANGUAGE: {self.language}. EXACTLY 70-80 words."
        res = self.client.chat.completions.create(model="llama-3.3-70b-versatile", messages=[{"role":"user","content":prompt}])
        return res.choices[0].message.content.strip()

    def generate_charts(self, data, flags):
        print("Generating Dynamic Charts based on User Selection...")
        
        # 1. MOMENTUM always included
        intraday = data.get('intraday')
        if intraday is None or intraday.empty: intraday = data['history'].tail(5)
        fig_mom = px.line(intraday, x=intraday.index, y="Close", template="plotly_dark", title=f"{data['token']} LIVE HEARTBEAT")
        fig_mom.update_traces(line=dict(color='#3b82f6', width=4))
        fig_mom.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font=dict(color="white"), showlegend=False)
        mom_path = os.path.join(self.asset_dir, "momentum.png")
        fig_mom.write_image(mom_path, width=1000, height=600)
        
        # 2. CANDLESTICK only if patterns enabled
        candle_path = None
        if flags.get('pattern') == 'true':
            candle_path = os.path.join(self.asset_dir, "candle.png")
            mpf.plot(data['history'].tail(25), type='candle', style='charles', savefig=candle_path, volume=True)
        
        return mom_path, candle_path

    async def generate_audio(self, script):
        voice = "hi-IN-SwaraNeural" if self.language == 'hi' else "en-US-AriaNeural"
        audio_path = os.path.join(self.asset_dir, "voice.mp3")
        communicate = edge_tts.Communicate(script, voice)
        await communicate.save(audio_path)
        return audio_path

    def overlay_text_pillow(self, text, size=(1280, 80), bg_color=(37, 99, 235, 200), font_size=35):
        img = Image.new('RGBA', size, bg_color)
        draw = ImageDraw.Draw(img)
        try: font = ImageFont.truetype("arial.ttf", font_size)
        except: font = ImageFont.load_default()
        bbox = draw.textbbox((0, 0), text, font=font)
        w, h = bbox[2]-bbox[0], bbox[3]-bbox[1]
        draw.text(((size[0]-w)/2, (size[1]-h)/2), text, fill="white", font=font)
        path = os.path.join(self.asset_dir, f"text_{abs(hash(text))}.png")
        img.save(path)
        return path

    def assemble(self, script, audio_path, mom_path, candle_path=None, motion_bg_path=None):
        print("Assembling Customized Broadcast...")
        audio = AudioFileClip(audio_path)
        duration = min(40, audio.duration)
        
        if motion_bg_path:
            try:
                bg = VideoFileClip(motion_bg_path).without_audio().resized(width=1280, height=720).with_duration(duration)
                if bg.duration < duration: bg = vfx.Loop(bg, duration=duration)
                bg = bg.with_effects([vfx.MultiplyColor(0.3)])
            except: bg = ColorClip(size=(1280, 720), color=(9, 9, 11)).with_duration(duration)
        else:
            bg = ColorClip(size=(1280, 720), color=(9, 9, 11)).with_duration(duration)

        header_p = self.overlay_text_pillow("MARKET SENTINEL AI BROADCAST", size=(1280, 80), bg_color=(15, 23, 42, 180))
        ticker_p = self.overlay_text_pillow(f"LIVE: {self.symbol} | SIGNAL: INTELLIGENCE ACQUIRED", size=(1280, 50), bg_color=(37, 99, 235, 255), font_size=25)
        
        header = ImageClip(header_p).with_duration(duration).with_position(("center", "top"))
        ticker = ImageClip(ticker_p).with_duration(duration).with_position(("center", "bottom"))
        
        mom_clip = (ImageClip(mom_path).with_duration(duration/2 if candle_path else duration).with_position(("center", "center"))
                    .resized(height=500).with_effects([vfx.FadeIn(1), vfx.FadeOut(1)]))
        
        clips = [bg, header, ticker, mom_clip]
        
        if candle_path:
            candle_clip = (ImageClip(candle_path).with_duration(duration/2).with_start(duration/2)
                           .with_position(("center", "center")).resized(height=500)
                           .with_effects([vfx.FadeIn(1), vfx.FadeOut(1)]))
            clips.append(candle_clip)
        
        video = CompositeVideoClip(clips)
        video = video.with_audio(audio.with_duration(duration))
        
        final_filename = f"{self.symbol}_custom_news.mp4"
        final_path = os.path.join(OUT_DIR, final_filename)
        video.write_videofile(final_path, fps=24, codec="libx264")
        return f"/generated_videos/{final_filename}"

async def main():
    if len(sys.argv) < 2: return
    symbol = sys.argv[1].upper()
    lang = sys.argv[2] if len(sys.argv) > 2 else "en"
    # Receive Intelligence Flags
    flags = {
        'fii': sys.argv[3] if len(sys.argv) > 3 else 'true',
        'ipo': sys.argv[4] if len(sys.argv) > 4 else 'true',
        'pattern': sys.argv[5] if len(sys.argv) > 5 else 'true'
    }
    
    gen = VideoGenerator(symbol, lang)
    data = gen.fetch_data()
    if not data: return
    
    script = gen.generate_script(data, flags)
    mom_p, candle_p = gen.generate_charts(data, flags)
    audio_p = await gen.generate_audio(script)
    motion_bg_p = gen.fetch_motion_background()
    
    video_url = gen.assemble(script, audio_p, mom_p, candle_p, motion_bg_p)
    print(f"SUCCESS|{video_url}")

if __name__ == "__main__":
    asyncio.run(main())
