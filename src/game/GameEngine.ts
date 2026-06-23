// 游戏引擎：管理机器人状态和指令队列

const DIRECTIONS = ['right', 'down', 'left', 'up'] as const
type Direction = typeof DIRECTIONS[number]

const DIR_ANGLE: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
}

export interface RobotState {
  x: number
  y: number
  direction: Direction
}

export type GameCommand = 'move_forward' | 'turn_left' | 'turn_right' | 'move_up' | 'move_down' | 'move_left' | 'move_right'
export type SenseResult = 'wall' | 'empty' | 'target' | 'collectible' | 'switch' | 'door' | 'teleporter'

// ====== 关卡数据结构（灵活可扩展）======

// 格子坐标
export interface Cell {
  x: number
  y: number
}

// 收集品
export interface Collectible {
  id: string
  x: number
  y: number
  type?: string  // 后续可扩展不同类型（金币、钥匙等）
}

// 开关
export interface Switch {
  id: string
  x: number
  y: number
  targetDoorId: string  // 控制的门
}

// 门（被开关控制）
export interface Door {
  id: string
  x: number
  y: number
  open: boolean  // 初始是否打开
}

// 传送点
export interface Teleporter {
  id: string
  x: number
  y: number
  pairId: string  // 配对的传送点 id
}

export interface MysteryCell {
  x: number
  y: number
}

// 关卡运行时状态（执行过程中会变化的状态）
export interface LevelRuntimeState {
  collected: Set<string>        // 已收集的物品 id
  activatedSwitches: Set<string> // 已激活的开关 id
  openedDoors: Set<string>      // 已打开的门 id
  snakeBody?: Cell[]            // 蛇身队列，队首是蛇头。仅 snakeMode 关卡使用
}

export interface LevelHint {
  goal: string
  tips: string[]
  api: Array<{
    name: string
    description: string
    returns?: string
  }>
}

export interface LevelTestCase {
  name: string
  start: RobotState
  target: Cell
  walls?: Cell[]
  collectibles?: Collectible[]
  switches?: Switch[]
  doors?: Door[]
  teleporters?: Teleporter[]
  mysteryCells?: MysteryCell[]
}

// 关卡数据：只有 id、name、gridSize、start 是必需的，其他全部可选
export interface LevelData {
  id: string
  name: string
  description?: string
  hint?: LevelHint
  intro?: {
    title: string
    story: string
    actionLabel?: string
  }
  gridSize: number
  start: RobotState
  // 以下全部可选，由关卡设计者按需使用
  target?: Cell                    // 终点
  walls?: Cell[]                   // 障碍物
  collectibles?: Collectible[]     // 收集品
  switches?: Switch[]              // 开关
  doors?: Door[]                   // 门
  teleporters?: Teleporter[]       // 传送点
  mysteryCells?: MysteryCell[]     // 神秘方块，实际可能是墙或空气
  testCases?: LevelTestCase[]      // 多测试用例关卡
  // 每次进入关卡时生成本局关卡数据，可用于随机地图
  createSessionLevel?: () => LevelData
  // 动态星星数量：收集到一颗后自动在随机空白格生成下一颗，收集满此数量通关
  dynamicStarCount?: number
  // 贪吃蛇模式：机器人有蛇身，吃星星后变长，撞到自己则失败
  snakeMode?: boolean
  // 通关条件：由关卡自定义。不提供则默认"到达终点"
  checkWin?: (robot: RobotState, runtime: LevelRuntimeState, level: LevelData) => boolean
  // 初始代码模板（可选，给玩家提示）
  starterCode?: string
  // 标准答案（可选，玩家点击按钮后显示）
  solutionCode?: string
}

// 默认运行时状态
export function createRuntimeState(level?: LevelData): LevelRuntimeState {
  const state: LevelRuntimeState = {
    collected: new Set(),
    activatedSwitches: new Set(),
    openedDoors: new Set(),
  }
  if (level?.snakeMode) {
    state.snakeBody = [{ x: level.start.x, y: level.start.y }]
  }
  return state
}

export function createLevelFromTestCase(level: LevelData, testCase: LevelTestCase): LevelData {
  return {
    ...level,
    start: testCase.start,
    target: testCase.target,
    walls: testCase.walls,
    collectibles: testCase.collectibles,
    switches: testCase.switches,
    doors: testCase.doors,
    teleporters: testCase.teleporters,
    mysteryCells: testCase.mysteryCells,
  }
}

// 网格配置（默认值，关卡可覆盖）
export const DEFAULT_GRID_SIZE = 5
export const DEFAULT_CELL_SIZE = 108

export function getCanvasSize(level: LevelData): number {
  return level.gridSize * DEFAULT_CELL_SIZE
}

// 兼容旧代码的导出
export const GRID_SIZE = DEFAULT_GRID_SIZE
export const CELL_SIZE = DEFAULT_CELL_SIZE
export const CANVAS_SIZE = GRID_SIZE * CELL_SIZE
export const INITIAL_ROBOT: RobotState = { x: 0, y: 2, direction: 'right' }

export { DIRECTIONS, DIR_ANGLE }
export type { Direction }

// 全局指令队列，Python 调用 API 时往里推指令
let commandQueue: GameCommand[] = []
let planningRobot: RobotState = { ...INITIAL_ROBOT }
let planningLevel: LevelData | null = null

export function startPlanning(level: LevelData) {
  commandQueue = []
  planningRobot = { ...level.start }
  planningLevel = level
}

function getForwardCell(robot: RobotState): Cell {
  const dx = robot.direction === 'right' ? 1 : robot.direction === 'left' ? -1 : 0
  const dy = robot.direction === 'down' ? 1 : robot.direction === 'up' ? -1 : 0
  return { x: robot.x + dx, y: robot.y + dy }
}

function rotateDirection(direction: Direction, turn: 'left' | 'right'): Direction {
  const idx = DIRECTIONS.indexOf(direction)
  return turn === 'left' ? DIRECTIONS[(idx + 3) % 4] : DIRECTIONS[(idx + 1) % 4]
}

function isSameCell(cell: Cell | undefined, x: number, y: number): boolean {
  return Boolean(cell && cell.x === x && cell.y === y)
}

// 获取并清空指令队列
export function drainCommands(): GameCommand[] {
  const cmds = [...commandQueue]
  commandQueue = []
  return cmds
}

// 以下函数会被注入到 Pyodide 的 Python 环境中
// 玩家在 Python 中调用 robot.move_forward() 时，实际调用这些函数

export function robotMoveForward() {
  commandQueue.push('move_forward')
  if (!planningLevel) return
  const result = applyCommand(planningRobot, 'move_forward', planningLevel)
  if (!result.collision) planningRobot = result.robot
}

export function robotTurnLeft() {
  commandQueue.push('turn_left')
  planningRobot = { ...planningRobot, direction: rotateDirection(planningRobot.direction, 'left') }
}

export function robotTurnRight() {
  commandQueue.push('turn_right')
  planningRobot = { ...planningRobot, direction: rotateDirection(planningRobot.direction, 'right') }
}

// 直接朝指定方向移动一格（不改变机器人"逻辑朝向"，但渲染时会更新朝向）
export function robotMoveUp() {
  commandQueue.push('move_up')
  if (!planningLevel) return
  const result = applyCommand(planningRobot, 'move_up', planningLevel)
  if (!result.collision) planningRobot = result.robot
}

export function robotMoveDown() {
  commandQueue.push('move_down')
  if (!planningLevel) return
  const result = applyCommand(planningRobot, 'move_down', planningLevel)
  if (!result.collision) planningRobot = result.robot
}

export function robotMoveLeft() {
  commandQueue.push('move_left')
  if (!planningLevel) return
  const result = applyCommand(planningRobot, 'move_left', planningLevel)
  if (!result.collision) planningRobot = result.robot
}

export function robotMoveRight() {
  commandQueue.push('move_right')
  if (!planningLevel) return
  const result = applyCommand(planningRobot, 'move_right', planningLevel)
  if (!result.collision) planningRobot = result.robot
}

export function robotSense(): SenseResult {
  if (!planningLevel) return 'empty'

  const cell = getForwardCell(planningRobot)
  if (cell.x < 0 || cell.x >= planningLevel.gridSize || cell.y < 0 || cell.y >= planningLevel.gridSize) {
    return 'wall'
  }
  if (planningLevel.walls?.some(w => w.x === cell.x && w.y === cell.y)) return 'wall'
  if (planningLevel.doors?.some(d => d.x === cell.x && d.y === cell.y && !d.open)) return 'door'
  if (isSameCell(planningLevel.target, cell.x, cell.y)) return 'target'
  if (planningLevel.collectibles?.some(c => c.x === cell.x && c.y === cell.y)) return 'collectible'
  if (planningLevel.switches?.some(s => s.x === cell.x && s.y === cell.y)) return 'switch'
  if (planningLevel.teleporters?.some(t => t.x === cell.x && t.y === cell.y)) return 'teleporter'
  return 'empty'
}

// 指令执行结果
export interface CommandResult {
  robot: RobotState
  collision: boolean  // 是否撞墙
  collectedItemId?: string  // 收集到的物品 id
  activatedSwitchId?: string  // 激活的开关 id
  teleported?: boolean  // 是否触发了传送
}

// 根据指令计算新的机器人状态，返回结果包含碰撞标记
export function applyCommand(
  robot: RobotState,
  cmd: GameCommand,
  level: LevelData,
  runtime?: LevelRuntimeState
): CommandResult {
  const rt = runtime ?? createRuntimeState()

  // 处理转向指令
  if (cmd === 'turn_left') {
    const idx = DIRECTIONS.indexOf(robot.direction)
    return { robot: { ...robot, direction: DIRECTIONS[(idx + 3) % 4] }, collision: false }
  }
  if (cmd === 'turn_right') {
    const idx = DIRECTIONS.indexOf(robot.direction)
    return { robot: { ...robot, direction: DIRECTIONS[(idx + 1) % 4] }, collision: false }
  }

  // 处理移动指令：move_forward 沿当前朝向，move_up/down/left/right 沿指定方向
  let dx = 0
  let dy = 0
  let newDirection = robot.direction
  if (cmd === 'move_forward') {
    dx = robot.direction === 'right' ? 1 : robot.direction === 'left' ? -1 : 0
    dy = robot.direction === 'down' ? 1 : robot.direction === 'up' ? -1 : 0
  } else if (cmd === 'move_up') {
    dy = -1
    newDirection = 'up'
  } else if (cmd === 'move_down') {
    dy = 1
    newDirection = 'down'
  } else if (cmd === 'move_left') {
    dx = -1
    newDirection = 'left'
  } else if (cmd === 'move_right') {
    dx = 1
    newDirection = 'right'
  } else {
    return { robot, collision: false }
  }

  const newX = robot.x + dx
  const newY = robot.y + dy

  // 碰撞检测：超出网格边界
  if (newX < 0 || newX >= level.gridSize || newY < 0 || newY >= level.gridSize) {
    return { robot, collision: true }
  }

  // 碰撞检测：撞到障碍物
  if (level.walls?.some(w => w.x === newX && w.y === newY)) {
    return { robot, collision: true }
  }

  // 碰撞检测：撞到关闭的门
  if (level.doors?.some(d => d.x === newX && d.y === newY && !rt.openedDoors.has(d.id))) {
    return { robot, collision: true }
  }

  // 贪吃蛇模式：蛇身碰撞检测
  if (level.snakeMode && rt.snakeBody) {
    // 先判断是否会吃到星星（吃到则蛇尾不前移，需检查整个蛇身）
    const willEat = level.collectibles?.some(
      c => c.x === newX && c.y === newY && !rt.collected.has(c.id)
    ) ?? false
    // 没吃到星星时蛇尾会前移让位，所以蛇尾位置可以进入
    const bodyToCheck = willEat
      ? rt.snakeBody
      : rt.snakeBody.slice(0, -1) // 排除蛇尾
    if (bodyToCheck.some(seg => seg.x === newX && seg.y === newY)) {
      return { robot, collision: true }
    }
  }

  const result: CommandResult = { robot: { ...robot, x: newX, y: newY, direction: newDirection }, collision: false }

  // 检查是否踩到收集品
  const collectible = level.collectibles?.find(c => c.x === newX && c.y === newY && !rt.collected.has(c.id))
  if (collectible) {
    rt.collected.add(collectible.id)
    result.collectedItemId = collectible.id
  }

  // 贪吃蛇模式：更新蛇身
  if (level.snakeMode && rt.snakeBody) {
    const newHead: Cell = { x: newX, y: newY }
    if (collectible) {
      // 吃到星星：蛇身增长（不删蛇尾）
      rt.snakeBody = [newHead, ...rt.snakeBody]
    } else {
      // 没吃到：蛇尾前移
      rt.snakeBody = [newHead, ...rt.snakeBody.slice(0, -1)]
    }
  }

  // 检查是否踩到开关
  const sw = level.switches?.find(s => s.x === newX && s.y === newY && !rt.activatedSwitches.has(s.id))
  if (sw) {
    rt.activatedSwitches.add(sw.id)
    // 打开对应的门
    rt.openedDoors.add(sw.targetDoorId)
    result.activatedSwitchId = sw.id
  }

  // 检查是否踩到传送点
  const teleporter = level.teleporters?.find(t => t.x === newX && t.y === newY)
  if (teleporter) {
    const pair = level.teleporters?.find(t => t.id === teleporter.pairId)
    if (pair) {
      result.robot = { ...result.robot, x: pair.x, y: pair.y }
      result.teleported = true
    }
  }

  return result
}

// 默认通关条件：到达终点
export function defaultCheckWin(robot: RobotState, _runtime: LevelRuntimeState, level: LevelData): boolean {
  if (!level.target) return false
  return robot.x === level.target.x && robot.y === level.target.y
}

// 动态星星 id 计数器
let dynamicStarCounter = 0

/**
 * 在地图的随机空白格生成一颗新星星。
 * 排除机器人当前位置、墙壁、以及未收集的星星所在格子。
 */
export function generateRandomStar(
  level: LevelData,
  robot: RobotState,
  runtime: LevelRuntimeState
): Collectible | null {
  const occupied = new Set<string>()
  occupied.add(`${robot.x},${robot.y}`)
  level.walls?.forEach(w => occupied.add(`${w.x},${w.y}`))
  // 贪吃蛇模式：排除蛇身占据的格子
  if (level.snakeMode && runtime.snakeBody) {
    runtime.snakeBody.forEach(seg => occupied.add(`${seg.x},${seg.y}`))
  }
  level.collectibles?.forEach(c => {
    if (!runtime.collected.has(c.id)) {
      occupied.add(`${c.x},${c.y}`)
    }
  })

  const emptyCells: Cell[] = []
  for (let y = 0; y < level.gridSize; y += 1) {
    for (let x = 0; x < level.gridSize; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        emptyCells.push({ x, y })
      }
    }
  }
  if (emptyCells.length === 0) return null

  const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  dynamicStarCounter += 1
  return { id: `dynamic-star-${dynamicStarCounter}`, x: cell.x, y: cell.y }
}
