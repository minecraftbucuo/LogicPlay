import { useState, useEffect, useRef } from 'react'
import GameCanvas from './GameCanvas'
import { loadPyodide, runPython } from '../sandbox/PyodideRunner'
import {
  applyCommand,
  createRuntimeState,
  defaultCheckWin,
  type RobotState,
  type GameCommand,
  type LevelData,
  type LevelRuntimeState,
} from '../game/GameEngine'
import { getFirstLevel, getLevelById, getNextLevel } from '../game/LevelRegistry'
import { completeLevel } from '../game/ProgressStore'

interface GamePlayProps {
  levelId: string
  onBackToLevelSelect: () => void
  onSelectLevel: (levelId: string) => void
}

function GamePlay({ levelId, onBackToLevelSelect, onSelectLevel }: GamePlayProps) {
  const level: LevelData = getLevelById(levelId) ?? getFirstLevel()
  const nextLevel = getNextLevel(level.id)
  const [code, setCode] = useState(level.starterCode ?? '')
  const [pyodideReady, setPyodideReady] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(true)
  const [output, setOutput] = useState('')
  const [robot, setRobot] = useState<RobotState>(level.start)
  const [runtime, setRuntime] = useState<LevelRuntimeState>(() => createRuntimeState())
  const [won, setWon] = useState(false)
  const executingRef = useRef(false)
  const cancelRef = useRef(false)

  useEffect(() => {
    cancelRef.current = true
    executingRef.current = false
    setRobot(level.start)
    setRuntime(createRuntimeState())
    setCode(level.starterCode ?? '')
    setOutput('')
    setWon(false)
  }, [levelId])

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

  const checkWin = (robot: RobotState, runtime: LevelRuntimeState): boolean => {
    return level.checkWin?.(robot, runtime, level) ?? defaultCheckWin(robot, runtime, level)
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
    let currentRuntime = createRuntimeState()
    let stopped = false
    executingRef.current = true
    cancelRef.current = false
    setRobot(currentRobot)
    setRuntime(currentRuntime)

    commands.forEach((cmd, index) => {
      setTimeout(() => {
        if (stopped || cancelRef.current) {
          executingRef.current = false
          return
        }

        const result = applyCommand(currentRobot, cmd, level, currentRuntime)
        if (result.collision) {
          stopped = true
          executingRef.current = false
          setOutput(prev => prev + '\n💥 撞墙了！机器人无法移动。')
          return
        }

        currentRobot = result.robot
        currentRuntime = {
          collected: new Set(currentRuntime.collected),
          activatedSwitches: new Set(currentRuntime.activatedSwitches),
          openedDoors: new Set(currentRuntime.openedDoors),
        }
        setRobot({ ...currentRobot })
        setRuntime(currentRuntime)

        if (result.collectedItemId) {
          setOutput(prev => prev + `\n⭐ 收集到物品：${result.collectedItemId}`)
        }
        if (result.activatedSwitchId) {
          setOutput(prev => prev + `\n🔘 激活开关：${result.activatedSwitchId}`)
        }
        if (result.teleported) {
          setOutput(prev => prev + '\n🌀 触发传送。')
        }

        if (checkWin(currentRobot, currentRuntime)) {
          stopped = true
          executingRef.current = false
          completeLevel(level.id)
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
    setRuntime(createRuntimeState())
    setCode(level.starterCode ?? '')
    setOutput('')
    setWon(false)
  }

  return (
    <div className="app">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
        <button
          onClick={onBackToLevelSelect}
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
          ← 返回关卡选择
        </button>
        <div>
          <h1 style={{ margin: 0 }}>LogicPlay</h1>
          <div style={{ color: '#888', fontSize: '14px' }}>{level.name}：{level.description}</div>
        </div>
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

        </div>
        <GameCanvas robot={robot} level={level} runtime={runtime} />
      </div>

      {won && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div style={{
            position: 'relative',
            width: 'min(520px, calc(100vw - 48px))',
            padding: '36px',
            background: 'linear-gradient(145deg, #0f2f24, #0c1730)',
            border: '1px solid rgba(46, 204, 113, 0.65)',
            borderRadius: '20px',
            color: '#fff',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45), 0 0 60px rgba(46, 204, 113, 0.14)',
            textAlign: 'center',
          }}>
            <button
              onClick={() => setWon(false)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#dfffea',
                cursor: 'pointer',
                fontSize: '20px',
                lineHeight: '30px',
              }}
            >
              ×
            </button>

            <div style={{ fontSize: '56px', marginBottom: '14px' }}>🎉</div>
            <h2 style={{
              margin: '0 0 10px 0',
              color: '#7dffb2',
              fontSize: '30px',
              letterSpacing: '2px',
            }}>
              通关成功
            </h2>
            <p style={{
              margin: '0 0 8px 0',
              color: '#d8ffe7',
              fontSize: '16px',
              lineHeight: 1.7,
            }}>
              你完成了「{level.name}」。
            </p>
            <p style={{
              margin: '0 0 26px 0',
              color: '#9fd8b6',
              fontSize: '14px',
              lineHeight: 1.7,
            }}>
              {nextLevel ? `下一关「${nextLevel.name}」已解锁，你可以继续挑战，也可以返回关卡选择器。` : '你已经完成当前所有关卡，也可以返回关卡选择器查看进度。'}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {nextLevel && (
                <button
                  onClick={() => onSelectLevel(nextLevel.id)}
                  style={{
                    minWidth: '150px',
                    padding: '12px 22px',
                    border: 'none',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #2ecc71, #1f9e55)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                  }}
                >
                  下一关
                </button>
              )}
              <button
                onClick={onBackToLevelSelect}
                style={{
                  minWidth: '150px',
                  padding: '12px 22px',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#dfffea',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                返回关卡选择
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GamePlay
