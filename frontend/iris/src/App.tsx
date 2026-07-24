import { useState, useEffect } from 'react'

interface ModelStatus {
  accuracy: number;
  train_time: number;
  n_estimators: number;
  max_depth: number | null;
  test_size: number;
  random_state: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'predict' | 'train'>('predict')
  
  // 預測表單狀態
  const [sepalLength, setSepalLength] = useState<number>(5.1)
  const [sepalWidth, setSepalWidth] = useState<number>(3.5)
  const [petalLength, setPetalLength] = useState<number>(1.4)
  const [petalWidth, setPetalWidth] = useState<number>(0.2)
  
  // 訓練表單狀態
  const [nEstimators, setNEstimators] = useState<number>(100)
  const [maxDepth, setMaxDepth] = useState<number>(5)
  const [testSize, setTestSize] = useState<number>(0.2)
  const [randomState, setRandomState] = useState<number>(42)

  // 後端回傳狀態
  const [prediction, setPrediction] = useState<string | null>(null)
  const [probabilities, setProbabilities] = useState<Record<string, number> | null>(null)
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const backendRoot = 'https://onrender.com'

  // 自動觸發即時預測連線
  useEffect(() => {
    if (activeTab === 'predict') {
      const triggerPredict = async () => {
        try {
          const res = await fetch(`${backendRoot}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sepal_length: sepalLength,
              sepal_width: sepalWidth,
              petal_length: petalLength,
              petal_width: petalWidth,
            })
          })
          if (res.ok) {
            const data = await res.json()
            setPrediction(data.prediction)
            setProbabilities(data.probabilities)
          }
        } catch (err) {
          console.error("即時預測失敗", err)
        }
      }
      const delayDebounce = setTimeout(triggerPredict, 300)
      return () => clearTimeout(delayDebounce)
    }
  }, [sepalLength, sepalWidth, petalLength, petalWidth, activeTab])

  // 線上重新訓練連線
  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${backendRoot}/train`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          n_estimators: nEstimators,
          max_depth_val: maxDepth,
          test_size: testSize,
          random_state: randomState
        })
      })
      if (!res.ok) throw new Error('訓練失敗，後端拒絕連線')
      const data = await res.json()
      if (data.status === 'success') {
        setModelStatus({
          accuracy: data.accuracy,
          train_time: data.train_time,
          n_estimators: nEstimators,
          max_depth: maxDepth,
          test_size: testSize,
          random_state: randomState
        })
        alert(`🎉 模型重新訓練成功！新準確度：${(data.accuracy * 100).toFixed(1)}%`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 flex flex-col items-center">
      {/* 標題與 Logo 區塊 */}
      <div className="text-center my-6">
        <h1 className="text-4xl font-black text-emerald-600 flex items-center justify-center gap-2">
          🌸 Iris 鳶尾花機器學習平台
        </h1>
        <p className="text-slate-500 mt-2 max-w-xl">
          結合 FastAPI 與隨機森林模型的完整機器學習生命週期展示：即時預測品種，並可線上調整超參數重新訓練。
        </p>
      </div>

      {/* 分頁切換按鈕 */}
      <div className="flex bg-slate-200 rounded-full p-1 mb-8 shadow-inner w-80">
        <button 
          onClick={() => setActiveTab('predict')}
          className={`flex-1 py-2 rounded-full font-bold transition ${activeTab === 'predict' ? 'bg-emerald-500 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
        >
          🔮 即時預測
        </button>
        <button 
          onClick={() => setActiveTab('train')}
          className={`flex-1 py-2 rounded-full font-bold transition ${activeTab === 'train' ? 'bg-emerald-500 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
        >
          ⚙️ 線上訓練
        </button>
      </div>

      {/* 主版面配置 */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* 左側：控制輸入面板 */}
        <div className="md:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          {activeTab === 'predict' ? (
            <div>
              <h2 className="text-xl font-bold mb-6 text-slate-700 flex items-center gap-2">📐 輸入特徵</h2>
              <p className="text-xs text-slate-400 mb-4">拖動滑桿，結果會即時更新</p>
              
              {[
                { label: '花萼長度 Sepal Length (cm)', val: sepalLength, set: setSepalLength, min: 4.0, max: 8.0 },
                { label: '花萼寬度 Sepal Width (cm)', val: sepalWidth, set: setSepalWidth, min: 2.0, max: 5.5 },
                { label: '花瓣長度 Petal Length (cm)', val: petalLength, set: setPetalLength, min: 1.0, max: 7.0 },
                { label: '花瓣寬度 Petal Width (cm)', val: petalWidth, set: setPetalWidth, min: 0.1, max: 3.0 },
              ].map((item, idx) => (
                <div key={idx} className="mb-6">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono">{item.val} cm</span>
                  </div>
                  <input 
                    type="range" min={item.min} max={item.max} step="0.1" 
                    value={item.val} onChange={(e) => item.set(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleTrain}>
              <h2 className="text-xl font-bold mb-6 text-slate-700">🛠️ 超參數設定</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">決策樹數量 (n_estimators)</label>
                <input type="number" className="w-full p-2 border rounded-xl" value={nEstimators} onChange={(e)=>setNEstimators(parseInt(e.target.value))} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">最大深度 (max_depth)</label>
                <input type="number" className="w-full p-2 border rounded-xl" value={maxDepth} onChange={(e)=>setMaxDepth(parseInt(e.target.value))} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">測試集比例 (test_size)</label>
                <input type="number" step="0.05" min="0.1" max="0.5" className="w-full p-2 border rounded-xl" value={testSize} onChange={(e)=>setTestSize(parseFloat(e.target.value))} />
              </div>
              <button type="submit" disabled={loading} className="w-full mt-4 bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 shadow-md disabled:bg-slate-300">
                {loading ? '🚀 正在雲端重新訓練模型...' : '⚡ 立即重新訓練'}
              </button>
            </form>
          )}
        </div>
   {/* 右側：結果與圖表看板 */}
        <div className="md:col-span-7 space-y-6">
          {activeTab === 'predict' ? (
            <>
              {/* 品種預測主要大卡片 */}
              <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="text-slate-500 font-semibold text-sm">預測分析品種</h3>
                  <div className="text-4xl font-black text-emerald-700 mt-2">
                    {prediction ? prediction : '計算中...'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full mb-1">預測成功</span>
                  <div className="text-emerald-600 font-bold text-lg font-mono">
                    {probabilities && prediction ? `${(probabilities[prediction] * 100).toFixed(1)}%` : '100%'}
                  </div>
                </div>
              </div>

              {/* 機率分佈長條圖 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">📊 機率分佈</h3>
                <div className="space-y-4">
                  {probabilities ? Object.entries(probabilities).map(([species, prob]) => (
                    <div key={species} className="space-y-1">
                      <div className="flex justify-between text-sm font-medium">
                        <span className="text-slate-600">{species}</span>
                        <span className="font-mono text-slate-500">{(prob * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${prob * 100}%` }}></div>
                      </div>
                    </div>
                  )) : <p className="text-slate-400 text-sm text-center py-4">等待輸入特徵數據...</p>}
                </div>
              </div>
            </>
          ) : (
            /* 訓練結果看版 */
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-700 mb-4">📈 模型評估指標卡片</h3>
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm mb-4">❌ {error}</div>}
              {modelStatus ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl text-center">
                    <div className="text-xs text-slate-400 font-medium">測試集準確度</div>
                    <div className="text-2xl font-black text-emerald-600 mt-1">{(modelStatus.accuracy * 100).toFixed(1)}%</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl text-center">
                    <div className="text-xs text-slate-400 font-medium">訓練耗時</div>
                    <div className="text-2xl font-black text-slate-700 mt-1">{modelStatus.train_time.toFixed(4)}s</div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">尚未執行線上重新訓練，請調整左側參數並點擊按鈕。</p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}