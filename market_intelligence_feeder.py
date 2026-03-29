import sys
import json
from nselib import capital_market
import pandas as pd

def get_market_intel():
    try:
        # 1. FII/DII Trading Activity
        fii_dii = capital_market.fii_dii_trading_activity()
        fii_dii_data = []
        if not fii_dii.empty:
            # Get last 5 days
            recent = fii_dii.tail(5).to_dict('records')
            fii_dii_data = recent

        # 2. IPO Tracker (Recent Listings)
        ipo_data = []
        try:
            listings = capital_market.equity_list()
            if not listings.empty:
                # Use 'Listing Date' or just tail for recent
                recent_listings = listings.tail(10).to_dict('records')
                ipo_data = recent_listings
        except: pass

        return {
            "fii_dii": fii_dii_data,
            "ipo_tracker": ipo_data
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    intel = get_market_intel()
    print(json.dumps(intel))
