import { useState, useEffect, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import GameCanvas from './GameCanvas'
import { audioManager, type UISoundType, type GameSoundType } from '../audio/AudioManager'
import { loadPyodide, runPython } from '../sandbox/PyodideRunner'
import {
  applyCommand,
  createLevelFromTestCase,
  createRuntimeState,
  defaultCheckWin,
  generateRandomStar,
  type RobotState,
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
  const [runtime, setRuntime] = useState<LevelRuntimeState>(() => createRuntimeState(level))
  const [isExecuting, setIsExecuting] = useState(false)
  const [executingMode, setExecutingMode] = useState<'slow' | 'fast' | null>(null)
  const [introDismissed, setIntroDismissed] = useState(() => !level.intro)
  const [won, setWon] = useState(false)
  const [expandedEditor, setExpandedEditor] = useState(false)
  const [hintModalOpen, setHintModalOpen] = useState(false)
  const [solutionModalOpen, setSolutionModalOpen] = useState(false)
  const executingRef = useRef(false)
  const runTokenRef = useRef(0)
  const outputRef = useRef<HTMLPreElement | null>(null)

  useEffect(() => {
    const nextBaseLevel = getLevelById(levelId) ?? getFirstLevel()
    const nextLevel = nextBaseLevel.createSessionLevel?.() ?? nextBaseLevel
    setLevel(nextLevel)
    runTokenRef.current += 1
    executingRef.current = false
    setIsExecuting(false)
    setExecutingMode(null)
    setRobot(nextLevel.start)
    setRuntime(createRuntimeState(nextLevel))
    setCode(nextLevel.starterCode ?? '')
    setOutput('')
    setIntroDismissed(!nextLevel.intro)
    setWon(false)
    setHintModalOpen(false)
    setSolutionModalOpen(false)
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
  }, [])

  const checkWin = (robot: RobotState, runtime: LevelRuntimeState, activeLevel: LevelData): boolean => {
    return activeLevel.checkWin?.(robot, runtime, activeLevel) ?? defaultCheckWin(robot, runtime, activeLevel)
  }

  const isIntroActive = Boolean(level.intro && !introDismissed)

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const getStepDelay = (mode: 'slow' | 'fast') => mode === 'slow' ? 300 : 20

  const withSound = (type: UISoundType, action: () => void) => () => {
    audioManager.play(type)
    action()
  }

  const handleStopExecution = () => {
    if (!isExecuting) return
    audioManager.play('ui-stop')
    runTokenRef.current += 1
    executingRef.current = false
    setIsExecuting(false)
    setExecutingMode(null)
    setOutput(prev => `${prev}\n⏹ 已停止执行。`)
  }

  const handleRun = async (mode: 'slow' | 'fast') => {
    if (!pyodideReady || executingRef.current || isIntroActive) return
    audioManager.play('ui-confirm')
    const runToken = runTokenRef.current + 1
    runTokenRef.current = runToken
    executingRef.current = true
    setIsExecuting(true)
    setExecutingMode(mode)
    setWon(false)
    setOutput(mode === 'slow' ? '执行中，正在播放动画...' : '快速执行中，正在快速播放动画...')

    // 每次执行都从 baseLevel 重新生成 session level，避免上次执行残留的星星状态污染
    const freshLevel = baseLevel.createSessionLevel?.() ?? baseLevel
    const testLevels = freshLevel.testCases?.length
      ? freshLevel.testCases.map(testCase => ({ name: testCase.name, level: createLevelFromTestCase(freshLevel, testCase) }))
      : [{ name: freshLevel.name, level: { ...freshLevel, collectibles: freshLevel.collectibles?.map(c => ({ ...c })) ?? [] } }]

    let overallOutput = freshLevel.testCases?.length ? `共 ${testLevels.length} 个测试用例。` : ''

    for (let testIndex = 0; testIndex < testLevels.length; testIndex += 1) {
      const activeTest = testLevels[testIndex]
      const activeLevel = activeTest.level
      const currentRuntime = createRuntimeState(activeLevel)
      let currentRobot = { ...activeLevel.start }
      setLevel(activeLevel)
      setRobot(currentRobot)
      setRuntime(currentRuntime)

      const testTitle = freshLevel.testCases?.length ? `\n\n测试 ${testIndex + 1}/${testLevels.length}：${activeTest.name}` : ''
      setOutput(`${overallOutput}${testTitle}\n生成指令中...`)

      const { output: result, commands, error } = await runPython(code, activeLevel)
      if (runTokenRef.current !== runToken) return

      if (error) {
        setOutput(`${overallOutput}${testTitle}\n${result}`)
        setIsExecuting(false)
        setExecutingMode(null)
        executingRef.current = false
        return
      }

      let nextOutput = `${overallOutput}${testTitle}\n${result || '(无输出)'}\n已生成 ${commands.length} 条指令，${mode === 'slow' ? '开始慢速执行。' : '开始快速执行。'}`
      setOutput(nextOutput)

      let passed = false
      for (let index = 0; index < commands.length; index += 1) {
        if (runTokenRef.current !== runToken) return
        await wait(getStepDelay(mode))
        if (runTokenRef.current !== runToken) return

        const command = commands[index]
        const commandResult = applyCommand(currentRobot, command, activeLevel, currentRuntime)
        nextOutput += `\n▶ 第 ${index + 1} 步：${command}`

        if (commandResult.collision) {
          audioManager.play('collision')
          setRobot(currentRobot)
          setRuntime(currentRuntime)
          setOutput(`${nextOutput}\n💥 测试 ${testIndex + 1} 撞墙失败。`)
          setIsExecuting(false)
          setExecutingMode(null)
          executingRef.current = false
          return
        }

        currentRobot = { ...commandResult.robot }
        setRobot(currentRobot)
        setRuntime({
          collected: new Set(currentRuntime.collected),
          activatedSwitches: new Set(currentRuntime.activatedSwitches),
          openedDoors: new Set(currentRuntime.openedDoors),
          snakeBody: currentRuntime.snakeBody?.map(seg => ({ ...seg })),
        })

        // 快速模式下跳过移动/转向音效，避免变成噪音
        if (mode !== 'fast') {
          const isMove = command === 'move_forward' || command === 'move_up' || command === 'move_down' || command === 'move_left' || command === 'move_right'
          const stepSound: GameSoundType = isMove ? 'robot-step' : 'robot-turn'
          audioManager.play(stepSound)
        }

        if (commandResult.collectedItemId) {
          audioManager.play('collect')
          nextOutput += `\n⭐ 收集到物品：${commandResult.collectedItemId}（已收集 ${currentRuntime.collected.size}/${activeLevel.dynamicStarCount ?? level.collectibles?.length ?? 0}）`

          // 动态星星：收集后如果还未达标，在随机空白格生成新星星
          if (activeLevel.dynamicStarCount && currentRuntime.collected.size < activeLevel.dynamicStarCount) {
            const newStar = generateRandomStar(activeLevel, currentRobot, currentRuntime)
            if (newStar) {
              activeLevel.collectibles = [newStar]
              setLevel({ ...activeLevel, collectibles: [newStar] })
            }
          }
        }
        if (commandResult.activatedSwitchId) {
          nextOutput += `\n🔘 激活开关：${commandResult.activatedSwitchId}`
        }
        if (commandResult.teleported) {
          nextOutput += '\n🌀 触发传送。'
        }

        setOutput(nextOutput)

        if (checkWin(currentRobot, currentRuntime, activeLevel)) {
          passed = true
          audioManager.play(freshLevel.testCases?.length ? 'test-pass' : 'success')
          nextOutput += freshLevel.testCases?.length ? `\n✅ 测试 ${testIndex + 1}/${testLevels.length} 通过。` : '\n🎉 恭喜通关！'
          setOutput(nextOutput)
          break
        }
      }

      if (!passed) {
        setRobot(currentRobot)
        setRuntime(currentRuntime)
        setOutput(`${nextOutput}\n指令执行完毕，但测试 ${testIndex + 1} 还没有到达终点。`)
        setIsExecuting(false)
        setExecutingMode(null)
        executingRef.current = false
        return
      }

      overallOutput = nextOutput
    }

    if (freshLevel.testCases?.length) {
      const displayLevel = testLevels[0].level
      setLevel(displayLevel)
      setRobot(displayLevel.start)
      setRuntime(createRuntimeState(displayLevel))
    }
    const updatedProgress = completeLevel(freshLevel.id)
    setProgress(updatedProgress)
    setWon(true)
    audioManager.play('success')
    setOutput(freshLevel.testCases?.length ? `${overallOutput}\n\n🎉 所有测试通过，恭喜通关！` : overallOutput)
    setIsExecuting(false)
    setExecutingMode(null)
    executingRef.current = false
  }

  const handleReset = () => {
    audioManager.play('ui-click')
    const nextBaseLevel = getLevelById(levelId) ?? getFirstLevel()
    const nextLevel = nextBaseLevel.createSessionLevel?.() ?? nextBaseLevel
    setLevel(nextLevel)
    runTokenRef.current += 1
    executingRef.current = false
    setIsExecuting(false)
    setExecutingMode(null)
    setRobot(nextLevel.start)
    setRuntime(createRuntimeState(nextLevel))
    setCode(nextLevel.starterCode ?? '')
    setOutput('')
    setIntroDismissed(!nextLevel.intro)
    setWon(false)
    setHintModalOpen(false)
    setSolutionModalOpen(false)
  }

  const handleShowSolution = () => {
    if (!level.solutionCode || isIntroActive) return
    audioManager.play('ui-click')
    setSolutionModalOpen(true)
  }

  const handleUseSolution = () => {
    if (!level.solutionCode) return
    audioManager.play('ui-confirm')
    setCode(level.solutionCode)
    setSolutionModalOpen(false)
    setOutput('已将标准答案复制到编辑器。你可以直接执行，也可以先阅读后再自己改写。')
  }

  return (
    <div className="app game-page">
      <div className="level-header">
        <button className="level-back-btn" onClick={withSound('ui-back', onBackToLevelSelect)}>
          ← 返回关卡选择
        </button>
        <div className="level-title-block">
          <div className="level-kicker">LEVEL {String(levelNumber).padStart(2, '0')} / {String(LEVELS.length).padStart(2, '0')}</div>
          <h1>{level.name}</h1>
          <div className="level-subtitle">{level.description}</div>
        </div>
        <div className="level-header-slot">
          {nextLevel && canGoNext && (
            <button className="level-next-btn" onClick={withSound('ui-confirm', () => onSelectLevel(nextLevel.id))}>
              下一关 →
            </button>
          )}
        </div>
      </div>
      <div className="game-layout">
        <div className="editor-panel game-card">
          <div className="editor-toolbar">
            <div className="panel-title">代码控制台</div>
            <button className="editor-expand-btn" onClick={withSound('ui-click', () => setExpandedEditor(true))} disabled={isIntroActive}>
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
            <button
              className={`run-btn ${executingMode === 'slow' ? 'stop-btn' : 'primary-btn'}`}
              onClick={executingMode === 'slow' ? handleStopExecution : () => handleRun('slow')}
              disabled={!pyodideReady || isIntroActive || (isExecuting && executingMode !== 'slow')}
            >
              {executingMode === 'slow' ? '停止' : pyodideLoading ? '加载中...' : '执行'}
            </button>
            <button
              className={`run-btn ${executingMode === 'fast' ? 'stop-btn' : 'secondary-btn'}`}
              onClick={executingMode === 'fast' ? handleStopExecution : () => handleRun('fast')}
              disabled={!pyodideReady || isIntroActive || (isExecuting && executingMode !== 'fast')}
            >
              {executingMode === 'fast' ? '停止' : '快速执行'}
            </button>
            <button className="run-btn secondary-btn" onClick={handleReset}>
              重置关卡
            </button>
          </div>
          {(level.hint || level.solutionCode) && (
            <div className="assist-action-row">
              {level.hint && (
                <button className="assist-btn hint-btn" onClick={withSound('ui-click', () => setHintModalOpen(true))} disabled={isIntroActive}>
                  提示说明
                </button>
              )}
              {level.solutionCode && (
                <button className="assist-btn solution-btn" onClick={handleShowSolution} disabled={isIntroActive}>
                  显示标准答案
                </button>
              )}
            </div>
          )}
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
              <button className="editor-modal-close" onClick={withSound('ui-back', () => setExpandedEditor(false))}>
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
              <button className="run-btn secondary-btn" onClick={withSound('ui-back', () => setExpandedEditor(false))}>
                返回游戏
              </button>
              <button className="run-btn primary-btn" onClick={withSound('ui-confirm', () => setExpandedEditor(false))}>
                完成编辑
              </button>
            </div>
          </div>
        </div>
      )}

      {solutionModalOpen && level.solutionCode && (
        <div className="editor-modal-backdrop">
          <div className="solution-modal">
            <div className="editor-modal-header">
              <div>
                <div className="level-kicker">REFERENCE SOLUTION</div>
                <h2>标准答案</h2>
              </div>
              <button className="editor-modal-close" onClick={withSound('ui-back', () => setSolutionModalOpen(false))}>
                ×
              </button>
            </div>
            <CodeMirror
              className="code-editor solution-code-viewer"
              value={level.solutionCode}
              height="100%"
              theme={oneDark}
              extensions={[python()]}
              basicSetup={{
                lineNumbers: true,
                foldGutter: false,
                highlightActiveLine: false,
                bracketMatching: true,
                autocompletion: false,
              }}
              editable={false}
            />
            <div className="editor-modal-actions">
              <button className="run-btn secondary-btn" onClick={withSound('ui-back', () => setSolutionModalOpen(false))}>
                关闭
              </button>
              <button className="run-btn primary-btn" onClick={handleUseSolution}>
                复制到编辑器
              </button>
            </div>
          </div>
        </div>
      )}

      {hintModalOpen && level.hint && (
        <div className="editor-modal-backdrop">
          <div className="hint-modal">
            <div className="editor-modal-header">
              <div>
                <div className="level-kicker">MISSION HINT</div>
                <h2>提示说明</h2>
              </div>
              <button className="editor-modal-close" onClick={withSound('ui-back', () => setHintModalOpen(false))}>
                ×
              </button>
            </div>
            <div className="hint-modal-content">
              <section>
                <h3>过关目标</h3>
                <p>{level.hint.goal}</p>
              </section>
              <section>
                <h3>通关提示</h3>
                <ul>
                  {level.hint.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>命令说明</h3>
                <div className="hint-api-list">
                  {level.hint.api.map((item) => (
                    <div className="hint-api-card" key={item.name}>
                      <div className="hint-api-name">{item.name}</div>
                      <div className="hint-api-desc">{item.description}</div>
                      {item.returns && <div className="hint-api-return">返回：{item.returns}</div>}
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <div className="editor-modal-actions">
              <button className="run-btn primary-btn" onClick={withSound('ui-confirm', () => setHintModalOpen(false))}>
                明白了
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
            <button className="run-btn primary-btn" onClick={withSound('ui-confirm', () => setIntroDismissed(true))}>
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
              onClick={withSound('ui-back', () => setWon(false))}
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
                onClick={withSound('ui-back', onBackToLevelSelect)}
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
                  onClick={withSound('ui-confirm', () => onSelectLevel(nextLevel.id))}
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
