from enum import Enum  

import yfinance as yf  # Yahoo Finance 股票資料來源
from fastapi import FastAPI, HTTPException, Query  # FastAPI 核心元件
from fastapi.responses import HTMLResponse  # 用於回傳 HTML 頁面

app = FastAPI(
    title="台灣股票資料 API",
    description="依股票代碼查詢最近 1 天、1 星期、1 個月或 1 年的股價。",
    version="1.0.0",
)


class StockPeriod(str, Enum):
    """yfinance 支援的查詢期間。"""

    one_day = "1d"      # 最近 1 個交易日
    one_week = "5d"     # 最近 5 個交易日（約 1 星期）
    one_month = "1mo"   # 最近 1 個月
    one_year = "1y"     # 最近 1 年

PERIOD_LABELS = {
    StockPeriod.one_day: "1 天",
    StockPeriod.one_week: "1 星期",
    StockPeriod.one_month: "1 個月",
    StockPeriod.one_year: "1 年",
}


def get_stock_history(
    stock_code: str, period: StockPeriod
) -> list[dict[str, object]]:
    """使用 yfinance 取得台灣股票的歷史股價。"""
    symbol = f"{stock_code}.TW"
    history = yf.Ticker(symbol).history(period=period.value)

    records: list[dict[str, object]] = []
    for date, row in history.iterrows():
        records.append(
            {
                "date": date.isoformat(),       # 日期轉為 ISO 8601 字串
                "open": float(row["Open"]),      # 開盤價
                "high": float(row["High"]),      # 最高價
                "low": float(row["Low"]),        # 最低價
                "close": float(row["Close"]),    # 收盤價
                "volume": int(row["Volume"]),    # 成交量（股）
            }
        )
    return records


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
def home() -> str:
    """顯示美化後的股票期間查詢頁面。"""
    return """
    <!doctype html>
    <html lang="zh-Hant">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>台灣股票資料查詢系統</title>
        <!-- 引入 Tailwind CSS 進行外觀美化 -->
        <script src="https://jsdelivr.net"></script>
      </head>
      <body class="bg-slate-50 min-h-screen flex items-center justify-center font-sans antialiased text-slate-800 p-4">
        <div class="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-slate-100">
          
          <!-- 標題區 -->
          <div class="text-center mb-8">
            <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              📊 台灣股票查詢系統
            </h1>
            <p class="text-sm text-slate-500">輸入台股代碼，即時掌握歷史價格動態</p>
          </div>

          <!-- 表單區 -->
          <form action="/stock" method="get" class="space-y-6">
            
            <!-- 股票代碼輸入欄 -->
            <div>
              <label for="stock_code" class="block text-sm font-semibold text-slate-700 mb-2">股票代碼</label>
              <div class="relative">
                <input id="stock_code" name="stock_code" value="2330"
                       pattern="[0-9]{4,6}" maxlength="6" required
                       class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-200 font-mono text-lg font-bold tracking-wider placeholder-slate-400">
              </div>
              <p class="mt-1 text-xs text-slate-400">例如：2330 (台積電)、2317 (鴻海)</p>
            </div>

            <!-- 查詢期間下拉選單 -->
            <div>
              <label for="period" class="block text-sm font-semibold text-slate-700 mb-2">查詢期間</label>
              <select id="period" name="period" 
                      class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition duration-200">
                <option value="1d">1 天 (最新交易日)</option>
                <option value="5d">1 星期 (近 5 日)</option>
                <option value="1mo" selected>1 個月</option>
                <option value="1y">1 年</option>
              </select>
            </div>

            <!-- 提交按鈕 -->
            <button type="submit" 
                    class="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 transform active:scale-98 cursor-pointer text-center">
              立即查詢資料
            </button>
          </form>

          <!-- 底部連結 -->
          <div class="mt-8 pt-6 border-t border-slate-100 text-center">
            <a href="/docs" target="_blank" 
               class="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 transition duration-150">
              📚 檢視系統自動化 API 文件 (/docs) →
            </a>
          </div>

        </div>
      </body>
    </html>
    """

@app.get("/stock", summary="查詢台灣股票歷史股價")
def read_stock(
    stock_code: str = Query(
        default="2330",                              # 預設查詢台積電
        pattern=r"^[0-9]{4,6}$",                     # 正規表達式驗證：4~6 位數字
        description="台灣股票代碼，例如：2330、2317、0050",
    ),
    period: StockPeriod = Query(
        default=StockPeriod.one_month,               # 預設查詢 1 個月
        description="查詢期間：1d、5d、1mo 或 1y",
    ),
) -> dict[str, object]:
    """依股票代碼及指定期間回傳開、高、低、收與成交量。"""
    symbol = f"{stock_code}.TW"

    try:
        data = get_stock_history(stock_code, period)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="目前無法取得股票資料") from exc

    if not data:
        raise HTTPException(status_code=404, detail="查無股票資料")

    return {
        "stock_code": stock_code,         # 使用者輸入的股票代碼
        "symbol": symbol,                 # Yahoo Finance 格式的代碼（如 2330.TW）
        "period": period.value,           # 期間代碼（1d、5d 等）
        "period_label": PERIOD_LABELS[period],  # 期間中文標籤
        "count": len(data),               # 查詢到的交易日筆數
        "data": data,                     # 歷史股價陣列
    }

if __name__ == "__main__":
    import uvicorn  # ASGI 伺服器，用於執行 FastAPI 應用

    uvicorn.run(app, host="127.0.0.1", port=8000)
