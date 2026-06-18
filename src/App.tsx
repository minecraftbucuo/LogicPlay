import { useState, useEffect, useRef } from 'react'
import GameCanvas from './components/GameCanvas'
import { loadPyodide, runPython } from './sandbox/PyodideRunner'
import { DEFAULT_LEVEL, applyCommand, type RobotState, type GameCommand, type LevelData } from './game/GameEngine'
import './App.css'

function App() {
  const [code, setCode] = useState('# 绕过障碍物走到终点\nrobot.move_forward()\nrobot.turn_right()\nrobot.move_forward()\nrobot.turn_left()\nrobot.move_forward()\nrobot.move_forward()\nrobot.turn_left()\nrobot.move_forward()\nrobot.turn_right()\nrobot.move_forward()')
  const [pyodideReady, setPyodideReady] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(true)
  const [output, setOutput] = useState('')
  const [robot, setRobot] = useState<RobotState>(DEFAULT_LEVEL.start)
  const [level] = useState<LevelData>(DEFAULT_LEVEL)
  const [won, setWon] = useState(false)
  const executingRef = useRef(false)

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

  // 检查是否到达终点
  const checkWin = (robot: RobotState): boolean => {
    return robot.x === level.target.x && robot.y === level.target.y
  }

  const handleRun = async () => {
    if (!pyodideReady || executingRef.current) return
    setWon(false)
    setOutput('执行中...')

    const { output: result, commands } = await runPython(code)
    setOutput(result || '(无输出)')

    if (commands.length > 0) {
      executeCommands(commands)
    }
  }

  // 逐条执行指令，每条间隔 300ms，碰撞时停止，到达终点时庆祝
  const executeCommands = (commands: GameCommand[]) => {
    let currentRobot = { ...level.start }
    let stopped = false
    executingRef.current = true
    setRobot(currentRobot)

    commands.forEach((cmd, index) => {
      setTimeout(() => {
        if (stopped) return

        const result = applyCommand(currentRobot, cmd, level)
        if (result.collision) {
          stopped = true
          executingRef.current = false
          setOutput(prev => prev + '\n💥 撞墙了！机器人无法移动。')
          return
        }
        currentRobot = result.robot
        setRobot({ ...currentRobot })

        // 检查是否到达终点
        if (checkWin(currentRobot)) {
          stopped = true
          executingRef.current = false
          setWon(true)
          setOutput(prev => prev + '\n🎉 恭喜通关！')
        }

        // 最后一条指令执行完
        if (index === commands.length - 1) {
          executingRef.current = false
        }
      }, (index + 1) * 300)
    })
  }

  // 重置机器人到初始位置
  const handleReset = () => {
    setRobot(level.start)
    setOutput('')
    setWon(false)
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
          {won && (
            <div style={{
              marginTop: '8px',
              padding: '12px',
              background: '#2ecc71',
              color: '#fff',
              borderRadius: '6px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '18px',
            }}>
              🎉 通关成功！
            </div>
          )}
        </div>
        <GameCanvas robot={robot} level={level} />
      </div>
    </div>
  )
}

export default App
