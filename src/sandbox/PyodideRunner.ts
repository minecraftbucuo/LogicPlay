// Pyodide 沙箱执行器：在浏览器中运行 Python 代码

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>
  globals: {
    get: (key: string) => unknown
  }
}

let pyodide: PyodideInterface | null = null
let loadingPromise: Promise<void> | null = null

// 加载 Pyodide 运行时（从本地 public 目录加载）
export async function loadPyodide(): Promise<void> {
  if (pyodide) return
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    // 动态加载 pyodide.js 脚本
    await new Promise<void>((resolve, reject) => {
      // 如果已经加载过就跳过
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

// 执行 Python 代码，返回输出结果
export async function runPython(code: string): Promise<string> {
  if (!pyodide) throw new Error('Pyodide 未加载')

  try {
    // 用 exec 执行用户代码，重定向 stdout 捕获 print 输出
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
    return String(result)
  } catch (error) {
    return `错误: ${error}`
  }
}

// 在 Pyodide 中注入游戏 API（后续步骤扩展）
export async function injectGameApi(apiObject: Record<string, (...args: unknown[]) => void>): Promise<void> {
  if (!pyodide) throw new Error('Pyodide 未加载')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any
  for (const [name, fn] of Object.entries(apiObject)) {
    win[name] = fn
  }

  await pyodide.runPythonAsync(`
from js import ${Object.keys(apiObject).join(', ')}
`)
}
