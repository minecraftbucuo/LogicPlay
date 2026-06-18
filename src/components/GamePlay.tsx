import { useState, useEffect, useRef } from 'react'
import GameCanvas from './GameCanvas'
import { loadPyodide, runPython } from '../sandbox/PyodideRunner'
import { DEFAULT_LEVEL, applyCommand, type RobotState, type GameCommand, type LevelData } from '../game/GameEngine'

const DEFAULT_CODE = '# 绕过障碍物走到终点\nrobot.move_forward()\nrobot.turn_right()\nrobot.move_forward()\nrobot.turn_left()\nrobot.move_forward()\nrobot.move_forward()\nrobot.turn_left()\nrobot.move_forward()\nrobot.turn_right()\nrobot.move_forward()'

function GamePlay({ onBackToMenu }: { onBackToMenu: () => void }) {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [pyodideReady, setPyodideReady] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(true)
  const [output, setOutput] = useState('')
  const [robot, setRobot] = useState<RobotState>(DEFAULT_LEVEL.start)
  const [level] = useState<LevelData>(DEFAULT_LEVEL)
  const [won, setWon] = useState(false)
  const executingRef = useRef(false)
  const cancelRef = useRef(false)

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

  const executeCommands = (commands: GameCommand[]) => {
    let currentRobot = { ...level.start }
    let stopped = false
    executingRef.current = true
    cancelRef.current = false
    setRobot(currentRobot)

    commands.forEach((cmd, index) => {
      setTimeout(() => {
        if (stopped || cancelRef.current) {
          executingRef.current = false
          return
        }

        const result = applyCommand(currentRobot, cmd, level)
        if (result.collision) {
          stopped = true
          executingRef.current = false
          setOutput(prev => prev + '\n💥 撞墙了！机器人无法移动。')
          return
        }
        currentRobot = result.robot
        setRobot({ ...currentRobot })

        if (checkWin(currentRobot)) {
          stopped = true
          executingRef.current = false
          setWon(true)
          setOutput(prev => prev + '\n🎉 恭喜通关！')
        }

        if (index === commands.length - 1) {
          executingRef.current = false
        }
      }, (index + 1) * 300)
    })
  }

  const handleReset = () => {
    cancelRef.current = true
    executingRef.current = false
    setRobot(level.start)
    setCode(DEFAULT_CODE)
    setOutput('')
    setWon(false)
  }

  return (
    <div className="app">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
        <button
          onClick={onBackToMenu}
          style={{
            background: 'none',
            border: '1px solid #555',
            color: '#888',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← 返回菜单
        </button>
        <h1 style={{ margin: 0 }}>LogicPlay</h1>
      </div>
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

export default GamePlay
