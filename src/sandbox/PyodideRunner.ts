// Pyodide 沙箱执行器：在浏览器中运行 Python 代码

import {
  robotMoveForward,
  robotTurnLeft,
  robotTurnRight,
  robotMoveUp,
  robotMoveDown,
  robotMoveLeft,
  robotMoveRight,
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
      const base = import.meta.env.BASE_URL
      script.src = `${base}pyodide/pyodide.js`
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Pyodide 脚本加载失败'))
      document.head.appendChild(script)
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loadPyodideFn = (window as any).loadPyodide
    const base = import.meta.env.BASE_URL
    pyodide = await loadPyodideFn({
      indexURL: `${base}pyodide/`,
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
  win._robotMoveUp = robotMoveUp
  win._robotMoveDown = robotMoveDown
  win._robotMoveLeft = robotMoveLeft
  win._robotMoveRight = robotMoveRight
  win._robotSense = robotSense

  await pyodide!.runPythonAsync(`
from js import _robotMoveForward, _robotTurnLeft, _robotTurnRight, _robotMoveUp, _robotMoveDown, _robotMoveLeft, _robotMoveRight, _robotSense

class Robot:
    def move_forward(self):
        _robotMoveForward()
    def turn_left(self):
        _robotTurnLeft()
    def turn_right(self):
        _robotTurnRight()
    def move_up(self):
        _robotMoveUp()
    def move_down(self):
        _robotMoveDown()
    def move_left(self):
        _robotMoveLeft()
    def move_right(self):
        _robotMoveRight()
    def sense(self):
        return _robotSense()

robot = Robot()
`)

  apiInjected = true
}

const LOOP_ITERATION_LIMIT = 2000

// 执行 Python 代码，返回 { output, commands }
export async function runPython(code: string, level: LevelData): Promise<{ output: string; commands: GameCommand[]; error: boolean }> {
  if (!pyodide) throw new Error('Pyodide 未加载')

  await ensureApiInjected()
  startPlanning(level)

  try {
    const wrappedCode = `
import ast
import sys
from io import StringIO

class _LogicPlayLoopGuard:
    def __init__(self, limit):
        self.limit = limit
        self.count = 0
    def tick(self):
        self.count += 1
        if self.count > self.limit:
            raise RuntimeError('循环执行次数超过 ${LOOP_ITERATION_LIMIT} 次，请检查是否写成了死循环')

class _LogicPlayLoopGuardInjector(ast.NodeTransformer):
    def _guarded_body(self, node):
        guard_call = ast.Expr(
            value=ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='_logicplay_loop_guard', ctx=ast.Load()),
                    attr='tick',
                    ctx=ast.Load(),
                ),
                args=[],
                keywords=[],
            )
        )
        ast.copy_location(guard_call, node)
        node.body.insert(0, guard_call)
        return node
    def visit_For(self, node):
        self.generic_visit(node)
        return self._guarded_body(node)
    def visit_While(self, node):
        self.generic_visit(node)
        return self._guarded_body(node)

_capture_stdout = sys.stdout
sys.stdout = StringIO()
_exec_error = None
_logicplay_loop_guard = _LogicPlayLoopGuard(${LOOP_ITERATION_LIMIT})
try:
    _logicplay_tree = ast.parse(${JSON.stringify(code + '\n')})
    _logicplay_tree = _LogicPlayLoopGuardInjector().visit(_logicplay_tree)
    ast.fix_missing_locations(_logicplay_tree)
    exec(compile(_logicplay_tree, '<logicplay-user-code>', 'exec'))
except Exception as e:
    _exec_error = str(e)
_capture_output = sys.stdout.getvalue()
sys.stdout = _capture_stdout
_capture_output + ('错误: ' + _exec_error if _exec_error else '')
`
    const result = await pyodide.runPythonAsync(wrappedCode)
    const error = Boolean(pyodide.globals.get('_exec_error'))
    const commands = drainCommands()
    return { output: String(result), commands, error }
  } catch (error) {
    const commands = drainCommands()
    return { output: `错误: ${error}`, commands, error: true }
  }
}
