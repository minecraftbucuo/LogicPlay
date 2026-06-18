import { useState, useEffect, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
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
import { LEVELS, getFirstLevel, getLevelById, getLevelIndex, getNextLevel } from '../game/LevelRegistry'
import { completeLevel, isLevelUnlocked, loadProgress, type GameProgress } from '../game/ProgressStore'

interface GamePlayProps {
  levelId: string
  onBackToLevelSelect: () => void
  onSelectLevel: (levelId: string) => void
}

function GamePlay({ levelId, onBackToLevelSelect, onSelectLevel }: GamePlayProps) {
  const baseLevel: LevelData = getLevelById(levelId) ?? getFirstLevel()
  const [level, setLevel] = useState<LevelData>(() => baseLevel.createSessionLevel?.() ?? baseLevel)
  const levelIndex = getLevelIndex(level.id)
  const levelNumber = levelIndex >= 0 ? levelIndex + 1 : 1
  const nextLevel = getNextLevel(level.id)
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress())
  const canGoNext = nextLevel ? isLevelUnlocked(nextLevel.id, progress) : false
  const [code, setCode] = useState(level.starterCode ?? '')
  const [pyodideReady, setPyodideReady] = useState(false)
  const [pyodideLoading, setPyodideLoading] = useState(true)
  const [output, setOutput] = useState('')
  const [robot, setRobot] = useState<RobotState>(level.start)
  const [runtime, setRuntime] = useState<LevelRuntimeState>(() => createRuntimeState())
  const [pendingCommands, setPendingCommands] = useState<GameCommand[]>([])
  const [commandIndex, setCommandIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [executionEnded, setExecutionEnded] = useState(false)
  const [introDismissed, setIntroDismissed] = useState(() => !level.intro)
  const [won, setWon] = useState(false)
  const [expandedEditor, setExpandedEditor] = useState(false)
  const executingRef = useRef(false)
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const outputRef = useRef<HTMLPreElement | null>(null)
  const cancelRef = useRef(false)

  useEffect(() => {
    const nextBaseLevel = getLevelById(levelId) ?? getFirstLevel()
    const nextLevel = nextBaseLevel.createSessionLevel?.() ?? nextBaseLevel
    setLevel(nextLevel)
    cancelRef.current = true
    executingRef.current = false
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    setIsAutoPlaying(false)
    setPendingCommands([])
    setCommandIndex(0)
    setExecutionEnded(false)
    setRobot(nextLevel.start)
    setRuntime(createRuntimeState())
    setCode(nextLevel.starterCode ?? '')
    setOutput('')
    setIntroDismissed(!nextLevel.intro)
    setWon(false)
  }, [levelId])

  useEffect(() => {
    const outputElement = outputRef.current
    if (!outputElement) return
    outputElement.scrollTop = outputElement.scrollHeight
  }, [output])

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

    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    }
  }, [])

  const checkWin = (robot: RobotState, runtime: LevelRuntimeState): boolean => {
    return level.checkWin?.(robot, runtime, level) ?? defaultCheckWin(robot, runtime, level)
  }

  const hasPreparedCommands = pendingCommands.length > 0
  const isIntroActive = Boolean(level.intro && !introDismissed)
  const canStep = hasPreparedCommands && !executionEnded && commandIndex < pendingCommands.length && !isIntroActive

  useEffect(() => {
    if (!isAutoPlaying || executionEnded || commandIndex >= pendingCommands.length) return
    autoTimerRef.current = setTimeout(() => {
      executeNextCommand()
    }, 420)

    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    }
  }, [isAutoPlaying, executionEnded, commandIndex, pendingCommands.length, robot, runtime])

  const handleRun = async () => {
    if (!pyodideReady || executingRef.current || isIntroActive) return
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    cancelRef.current = false
    executingRef.current = false
    setIsAutoPlaying(false)
    setExecutionEnded(false)
    setWon(false)
    setOutput('执行中...')

    const { output: result, commands } = await runPython(code, level)
    const initialRobot = { ...level.start }
    const initialRuntime = createRuntimeState()
    setRobot(initialRobot)
    setRuntime(initialRuntime)
    setPendingCommands(commands)
    setCommandIndex(0)
    setOutput(`${result || '(无输出)'}\n已生成 ${commands.length} 条指令，可以单步执行或自动执行。`)
  }

  const finishExecution = (message?: string) => {
    executingRef.current = false
    setIsAutoPlaying(false)
    setExecutionEnded(true)
    if (message) setOutput(prev => `${prev}\n${message}`)
  }

  const executeNextCommand = () => {
    if (executingRef.current || executionEnded || commandIndex >= pendingCommands.length) return

    const cmd = pendingCommands[commandIndex]
    executingRef.current = true
    const result = applyCommand(robot, cmd, level, runtime)
    const nextStep = commandIndex + 1
    setCommandIndex(nextStep)
    setOutput(prev => `${prev}\n▶ 第 ${nextStep} 步：${cmd}`)

    if (result.collision) {
      finishExecution('💥 撞墙了！机器人无法移动。')
      return
    }

    const nextRuntime = {
      collected: new Set(runtime.collected),
      activatedSwitches: new Set(runtime.activatedSwitches),
      openedDoors: new Set(runtime.openedDoors),
    }

    setRobot({ ...result.robot })
    setRuntime(nextRuntime)

    if (result.collectedItemId) {
      setOutput(prev => prev + `\n⭐ 收集到物品：${result.collectedItemId}`)
    }
    if (result.activatedSwitchId) {
      setOutput(prev => prev + `\n🔘 激活开关：${result.activatedSwitchId}`)
    }
    if (result.teleported) {
      setOutput(prev => prev + '\n🌀 触发传送。')
    }

    if (checkWin(result.robot, nextRuntime)) {
      const updatedProgress = completeLevel(level.id)
      setProgress(updatedProgress)
      setWon(true)
      finishExecution('🎉 恭喜通关！')
      return
    }

    executingRef.current = false
    if (nextStep >= pendingCommands.length) {
      finishExecution('指令执行完毕，但还没有通关。')
    }
  }

  const handleReset = () => {
    const nextBaseLevel = getLevelById(levelId) ?? getFirstLevel()
    const nextLevel = nextBaseLevel.createSessionLevel?.() ?? nextBaseLevel
    setLevel(nextLevel)
    cancelRef.current = true
    executingRef.current = false
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    setIsAutoPlaying(false)
    setPendingCommands([])
    setCommandIndex(0)
    setExecutionEnded(false)
    setRobot(nextLevel.start)
    setRuntime(createRuntimeState())
    setCode(nextLevel.starterCode ?? '')
    setOutput('')
    setIntroDismissed(!nextLevel.intro)
    setWon(false)
  }

  return (
    <div className="app game-page">
      <div className="level-header">
        <button className="level-back-btn" onClick={onBackToLevelSelect}>
          ← 返回关卡选择
        </button>
        <div className="level-title-block">
          <div className="level-kicker">LEVEL {String(levelNumber).padStart(2, '0')} / {String(LEVELS.length).padStart(2, '0')}</div>
          <h1>{level.name}</h1>
          <div className="level-subtitle">{level.description}</div>
        </div>
        <div className="level-header-slot">
          {nextLevel && canGoNext && (
            <button className="level-next-btn" onClick={() => onSelectLevel(nextLevel.id)}>
              下一关 →
            </button>
          )}
        </div>
      </div>
      <div className="game-layout">
        <div className="editor-panel game-card">
          <div className="editor-toolbar">
            <div className="panel-title">代码控制台</div>
            <button className="editor-expand-btn" onClick={() => setExpandedEditor(true)} disabled={isIntroActive}>
              放大编辑
            </button>
          </div>
          <CodeMirror
            className="code-editor"
            value={code}
            height="100%"
            theme={oneDark}
            extensions={[python()]}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              bracketMatching: true,
              autocompletion: true,
            }}
            editable={!isIntroActive}
            onChange={(value) => setCode(value)}
          />
          <div className="action-row step-action-row">
            <button className="run-btn primary-btn" onClick={handleRun} disabled={!pyodideReady || isIntroActive}>
              {pyodideLoading ? '加载中...' : '生成指令'}
            </button>
            <button className="run-btn secondary-btn" onClick={executeNextCommand} disabled={!canStep || isAutoPlaying}>
              下一步 {hasPreparedCommands ? `${commandIndex}/${pendingCommands.length}` : ''}
            </button>
            <button className="run-btn secondary-btn" onClick={() => setIsAutoPlaying(prev => !prev)} disabled={!canStep}>
              {isAutoPlaying ? '暂停执行' : '自动执行'}
            </button>
            <button className="run-btn secondary-btn" onClick={handleReset}>
              重置关卡
            </button>
          </div>
          <div className="output-area">
            <div className="output-label">输出：</div>
            <pre ref={outputRef} className="output-content">{output}</pre>
          </div>
        </div>
        <div className="canvas-panel game-card">
          <div className="panel-title">运行地图</div>
          <GameCanvas robot={robot} level={level} runtime={runtime} />
        </div>
      </div>

      {expandedEditor && (
        <div className="editor-modal-backdrop">
          <div className="editor-modal">
            <div className="editor-modal-header">
              <div>
                <div className="level-kicker">EXPANDED EDITOR</div>
                <h2>放大编辑</h2>
              </div>
              <button className="editor-modal-close" onClick={() => setExpandedEditor(false)}>
                ×
              </button>
            </div>
            <CodeMirror
              className="code-editor expanded-code-editor"
              value={code}
              height="100%"
              theme={oneDark}
              extensions={[python()]}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                bracketMatching: true,
                autocompletion: true,
              }}
              onChange={(value) => setCode(value)}
            />
            <div className="editor-modal-actions">
              <button className="run-btn secondary-btn" onClick={() => setExpandedEditor(false)}>
                返回游戏
              </button>
              <button className="run-btn primary-btn" onClick={() => setExpandedEditor(false)}>
                完成编辑
              </button>
            </div>
          </div>
        </div>
      )}

      {isIntroActive && level.intro && (
        <div className="level-intro-backdrop">
          <div className="level-intro-card">
            <div className="level-kicker">MISSION BRIEFING</div>
            <h2>{level.intro.title}</h2>
            <p>{level.intro.story}</p>
            <button className="run-btn primary-btn" onClick={() => setIntroDismissed(true)}>
              {level.intro.actionLabel ?? '开始任务'}
            </button>
          </div>
        </div>
      )}

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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GamePlay
