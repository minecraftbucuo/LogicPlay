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

export type GameCommand = 'move_forward' | 'turn_left' | 'turn_right'

// 关卡数据
export interface LevelData {
  gridSize: number
  start: RobotState
  target: { x: number; y: number }
  walls: { x: number; y: number }[]  // 障碍物位置
}

// 默认关卡：中间有堵墙，需要绕路
export const DEFAULT_LEVEL: LevelData = {
  gridSize: 5,
  start: { x: 0, y: 2, direction: 'right' },
  target: { x: 4, y: 2 },
  walls: [
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 2, y: 3 },
  ],
}

// 网格配置
export const GRID_SIZE = 5
export const CELL_SIZE = 60
export const CANVAS_SIZE = GRID_SIZE * CELL_SIZE

export const INITIAL_ROBOT: RobotState = { x: 0, y: 2, direction: 'right' }

export { DIRECTIONS, DIR_ANGLE }
export type { Direction }

// 全局指令队列，Python 调用 API 时往里推指令
let commandQueue: GameCommand[] = []

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
}

export function robotTurnLeft() {
  commandQueue.push('turn_left')
}

export function robotTurnRight() {
  commandQueue.push('turn_right')
}

// 指令执行结果
export interface CommandResult {
  robot: RobotState
  collision: boolean  // 是否撞墙
}

// 根据指令计算新的机器人状态，返回结果包含碰撞标记
export function applyCommand(robot: RobotState, cmd: GameCommand, level?: LevelData): CommandResult {
  switch (cmd) {
    case 'move_forward': {
      const dx = robot.direction === 'right' ? 1 : robot.direction === 'left' ? -1 : 0
      const dy = robot.direction === 'down' ? 1 : robot.direction === 'up' ? -1 : 0
      const newX = robot.x + dx
      const newY = robot.y + dy

      // 碰撞检测：超出网格边界
      if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
        return { robot, collision: true }
      }

      // 碰撞检测：撞到障碍物
      if (level?.walls.some(w => w.x === newX && w.y === newY)) {
        return { robot, collision: true }
      }

      return { robot: { ...robot, x: newX, y: newY }, collision: false }
    }
    case 'turn_left': {
      const idx = DIRECTIONS.indexOf(robot.direction)
      return { robot: { ...robot, direction: DIRECTIONS[(idx + 3) % 4] }, collision: false }
    }
    case 'turn_right': {
      const idx = DIRECTIONS.indexOf(robot.direction)
      return { robot: { ...robot, direction: DIRECTIONS[(idx + 1) % 4] }, collision: false }
    }
  }
}
