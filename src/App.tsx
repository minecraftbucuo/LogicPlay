import { useState, useEffect } from 'react'
import GameCanvas from './components/GameCanvas'
import { loadPyodide, runPython } from './sandbox/PyodideRunner'
import { INITIAL_ROBOT, applyCommand, type RobotState, type GameCommand } from './game/GameEngine'
import './App.css'

function App() {
  const [code, setCode] = useState('# 控制机器人\nrobot.move_forward()\nrobot.move_forward()')
  const [pyodideReady, setPyodideReady] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(true)
  const [output, setOutput] = useState('')
  const [robot, setRobot] = useState<RobotState>(INITIAL_ROBOT)

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
    const { output: result, commands } = await runPython(code)
    setOutput(result || '(无输出)')

    // 逐条执行指令，更新机器人位置
    if (commands.length > 0) {
      executeCommands(commands)
    }
  }

  // 逐条执行指令，每条间隔 300ms，碰撞时停止
  const executeCommands = (commands: GameCommand[]) => {
    let currentRobot = { ...INITIAL_ROBOT }
    let stopped = false
    setRobot(currentRobot)

    commands.forEach((cmd, index) => {
      setTimeout(() => {
        if (stopped) return

        const result = applyCommand(currentRobot, cmd)
        if (result.collision) {
          stopped = true
          setOutput(prev => prev + '\n💥 撞墙了！机器人无法移动到网格外。')
          return
        }
        currentRobot = result.robot
        setRobot({ ...currentRobot })
      }, (index + 1) * 300)
    })
  }

  // 重置机器人到初始位置
  const handleReset = () => {
    setRobot(INITIAL_ROBOT)
    setOutput('')
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="run-btn" onClick={handleRun} disabled={!pyodideReady}>
              {pyodideLoading ? '加载中...' : '运行'}
            </button>
            <button className="run-btn" onClick={handleReset} style={{ background: '#555' }}>
              重置
            </button>
          </div>
          <div className="output-area">
            <div className="output-label">输出：</div>
            <pre className="output-content">{output}</pre>
          </div>
        </div>
        <GameCanvas robot={robot} />
      </div>
    </div>
  )
}

export default App
