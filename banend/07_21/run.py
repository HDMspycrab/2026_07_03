import yfinance as yf

# 抓取台積電 (2330.TW) 股票資料
tsmc = yf.Ticker("2330.TW")

# 取得最近 1 個月的日線資料
hist = tsmc.history(period="1mo")
print("=== TSMC 1 Month Stock ===")
print(hist.tail(10))

# 取得股票基本資訊
info = tsmc.info
print("\n=== Info ===")
print(f"Name: {info.get('shortName', 'N/A')}")
print(f"Price: {info.get('currentPrice', 'N/A')}")
print(f"MarketCap: {info.get('marketCap', 'N/A')}")
import pandas as pd
pd.set_option('display.max_columns', None)  # 讓欄位不要被 ... 隱藏
