// Pyodide 沙箱执行器：在浏览器中运行 Python 代码

import {
  robotMoveForward,
  robotTurnLeft,
  robotTurnRight,
  robotSense,
  startPlanning,
  drainCommands,
  type GameCommand,
  type LevelData,
} from '../game/GameEngine'

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>
  globals: {
    get: (key: string) => unknown
  }
}

let pyodide: PyodideInterface | null = null
let loadingPromise: Promise<void> | null = null
let apiInjected = false

// 加载 Pyodide 运行时（从本地 public 目录加载）
export async function loadPyodide(): Promise<void> {
  if (pyodide) return
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    await new Promise<void>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).loadPyodide) {
        resolve()
        return
      }
      const script = document.createElement('script')
      script.src = '/pyodide/pyodide.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Pyodide 脚本加载失败'))
      document.head.appendChild(script)
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadPyodideFn = (window as any).loadPyodide
    pyodide = await loadPyodideFn({
      indexURL: '/pyodide/',
    })
  })()

  return loadingPromise
}

// 注入 robot API 到 Pyodide 环境
async function ensureApiInjected(): Promise<void> {
  if (apiInjected) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any
  win._robotMoveForward = robotMoveForward
  win._robotTurnLeft = robotTurnLeft
  win._robotTurnRight = robotTurnRight
  win._robotSense = robotSense

  await pyodide!.runPythonAsync(`
from js import _robotMoveForward, _robotTurnLeft, _robotTurnRight, _robotSense

class Robot:
    def move_forward(self):
        _robotMoveForward()
    def turn_left(self):
        _robotTurnLeft()
    def turn_right(self):
        _robotTurnRight()
    def sense(self):
        return _robotSense()

robot = Robot()
`)

  apiInjected = true
}

// 执行 Python 代码，返回 { output, commands }
export async function runPython(code: string, level: LevelData): Promise<{ output: string; commands: GameCommand[] }> {
  if (!pyodide) throw new Error('Pyodide 未加载')

  await ensureApiInjected()
  startPlanning(level)

  try {
    const wrappedCode = `
import sys
from io import StringIO
_capture_stdout = sys.stdout
sys.stdout = StringIO()
_exec_error = None
try:
    exec(${JSON.stringify(code + '\n')})
except Exception as e:
    _exec_error = str(e)
_capture_output = sys.stdout.getvalue()
sys.stdout = _capture_stdout
_capture_output + ('错误: ' + _exec_error if _exec_error else '')
`
    const result = await pyodide.runPythonAsync(wrappedCode)
    const commands = drainCommands()
    return { output: String(result), commands }
  } catch (error) {
    const commands = drainCommands()
    return { output: `错误: ${error}`, commands }
  }
}
