import type { LevelData, LevelRuntimeState, RobotState, Collectible } from '../GameEngine'

const GRID_SIZE = 6
const STAR_TOTAL = 35

function checkSnakeWin(_robot: RobotState, runtime: LevelRuntimeState, level: LevelData): boolean {
  return runtime.collected.size >= (level.dynamicStarCount ?? STAR_TOTAL)
}

function createInitialStar(): Collectible | null {
  // 起点在 (0,0)，排除起点后随机选一格
  const emptyCells: { x: number; y: number }[] = []
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (x === 0 && y === 0) continue
      emptyCells.push({ x, y })
    }
  }
  if (emptyCells.length === 0) return null
  const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  return { id: 'initial-star', x: cell.x, y: cell.y }
}

const snakeSolution = `# 贪吃蛇模式：蛇会越来越长，但沿着哈密顿回路走就不会撞到自己
# 螺旋循环路径：向下到底 → 向右到墙 → 螺旋向上 → 回到起点

def one_loop():
    # 向下走到底
    while robot.sense() != 'wall':
        robot.move_forward()
    # 向右走到墙
    robot.turn_left()
    while robot.sense() != 'wall':
        robot.move_forward()
    # 螺旋向上，两层
    for i in range(2):
        robot.turn_left()
        robot.move_forward()
        robot.turn_left()
        for j in range(4):
            robot.move_forward()
        robot.turn_right()
        robot.move_forward()
        robot.turn_right()
        while robot.sense() != 'wall':
            robot.move_forward()
    # 最后一层：向上到顶，向左回起点
    robot.turn_left()
    robot.move_forward()
    robot.turn_left()
    while robot.sense() != 'wall':
        robot.move_forward()
    robot.turn_left()

# 重复走循环，直到收集满 35 颗星星
for loop in range(36):
    one_loop()`

export const snakeLevel: LevelData = {
  id: 'snake',
  name: '贪吃蛇',
  description: '设计一条覆盖整个地图的循环路径，让蛇头永远不撞到自己。',
  hint: {
    goal: '收集 35 颗星星，蛇身占满整个 6x6 地图。每吃一颗星星蛇身增长一格。',
    tips: [
      '蛇会越来越长，固定路线必须保证蛇头永远不撞到自己的身体。',
      '关键思路：找到一条覆盖所有格子并回到起点的闭合循环路径（哈密顿回路）。',
      '沿着循环路径走，蛇头始终走在蛇尾前面，永远不会撞到自己。',
      '螺旋路径：先向下走到底，再向右走到墙，然后向上走一格，向左走，再向上……直到回到起点。',
      '把一圈路径封装成函数，重复调用直到收集满 35 颗星星。',
      '用 robot.sense() 检测边界，避免硬编码步数。',
    ],
    api: [
      {
        name: 'robot.move_forward()',
        description: '沿当前朝向前进一格。经过星星所在格时会自动收集，蛇身增长一格。',
      },
      {
        name: 'robot.turn_left() / robot.turn_right()',
        description: '原地左转或右转 90 度，不会前进。',
      },
      {
        name: 'robot.sense()',
        description: '检查机器人前方一格是什么。返回 wall 表示前方是边界或墙。',
        returns: 'wall、empty、collectible 等',
      },
      {
        name: 'for i in range(n):',
        description: '重复执行 n 次，可用于控制循环路径的重复次数。',
      },
      {
        name: 'def 函数名():',
        description: '把一圈螺旋路径封装成函数，重复调用。',
      },
    ],
  },
  intro: {
    title: '第八项任务：贪吃蛇',
    story: '训练场开启了贪吃蛇模式。机器人每吃到一颗星星，身体就会变长一格；地图上会不断出现新的星星，直到机器人占满整个训练场。但有一个规则：机器人不能撞到自己的身体。你需要规划机器人的路径，使它能占满整个地图而且不碰到墙壁和自己。',
    actionLabel: '开始任务',
  },
  gridSize: GRID_SIZE,
  start: { x: 0, y: 0, direction: 'down' },
  snakeMode: true,
  dynamicStarCount: STAR_TOTAL,
  collectibles: [],
  checkWin: checkSnakeWin,
  createSessionLevel: () => {
    const star = createInitialStar()
    return {
      ...snakeLevel,
      collectibles: star ? [star] : [],
    }
  },
  starterCode: `# 提示：如果路径是循环的，蛇头始终走在蛇尾前面，就不会撞到自己
# 思考：怎样设计一条覆盖所有格子的循环路径？

def one_loop():
    # 走完一圈循环路径，回到起点
    pass

# 重复执行，直到收集满 35 颗星星
for loop in range(36):
    one_loop()
`,
  solutionCode: snakeSolution,
}
