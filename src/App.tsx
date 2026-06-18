import { useState, useEffect } from 'react'
import GameCanvas from './components/GameCanvas'
import { loadPyodide, runPython } from './sandbox/PyodideRunner'
import './App.css'

function App() {
  const [code, setCode] = useState('# 在这里写 Python 代码\nprint(1 + 1)')
  const [pyodideReady, setPyodideReady] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(true)
  const [output, setOutput] = useState('')

  // 页面加载时初始化 Pyodide
  useEffect(() => {
    loadPyodide()
      .then(() => {
        setPyodideReady(true)
        setPyodideLoading(false)
      })
      .catch(() => {
        setOutput('Pyodide 加载失败，请刷新重试')
        setPyodideLoading(false)
      })
  }, [])

  const handleRun = async () => {
    if (!pyodideReady) return
    setOutput('执行中...')
    const result = await runPython(code)
    setOutput(result)
  }

  return (
    <div className="app">
      <h1>LogicPlay</h1>
      <div className="game-layout">
        <div className="editor-panel">
          <textarea
            className="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
          <button className="run-btn" onClick={handleRun} disabled={!pyodideReady}>
            {pyodideLoading ? '加载中...' : '运行'}
          </button>
          <div className="output-area">
            <div className="output-label">输出：</div>
            <pre className="output-content">{output}</pre>
          </div>
        </div>
        <GameCanvas />
      </div>
    </div>
  )
}

export default App
