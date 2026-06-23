import type { LevelData, LevelRuntimeState, RobotState, Collectible } from '../GameEngine'
import { generateRandomStar } from '../GameEngine'

const GRID_SIZE = 5
const STAR_TOTAL = 3

function checkRandomHunterWin(_robot: RobotState, runtime: LevelRuntimeState, level: LevelData): boolean {
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

const randomHunterSolution = `# 蛇形扫描：逐行覆盖整个地图，保证不遗漏任何格子
# 用 robot.sense() 检测边界，避免硬编码步数撞墙

def scan_until_wall():
    while robot.sense() != 'wall':
        robot.move_forward()

def go_down_one_row():
    # 当朝右时：右转朝下，走一步，右转朝左
    robot.turn_right()
    robot.move_forward()
    robot.turn_right()

def go_down_one_row_from_left():
    # 当朝左时：左转朝下，走一步，左转朝右
    robot.turn_left()
    robot.move_forward()
    robot.turn_left()

def return_to_start():
    # 转向 180 度，走回行首，再往上走回第 0 行
    robot.turn_left()
    robot.turn_left()
    scan_until_wall()
    robot.turn_right()
    scan_until_wall()
    robot.turn_right()

# 5x5 地图，从 (0,0) 出发向右
# 重复扫描 3 次，确保收集满 3 颗星星
for scan in range(3):
    # 第 0 行：向右走到墙
    scan_until_wall()
    go_down_one_row()
    # 第 1 行：向左走到墙
    scan_until_wall()
    go_down_one_row_from_left()
    # 第 2 行：向右走到墙
    scan_until_wall()
    go_down_one_row()
    # 第 3 行：向左走到墙
    scan_until_wall()
    go_down_one_row_from_left()
    # 第 4 行：向右走到墙
    scan_until_wall()
    # 回到起点
    return_to_start()`

export const randomHunterLevel: LevelData = {
  id: 'random-hunter',
  name: '随机猎手',
  description: '设计一套系统性搜索策略，无论星星出现在哪都能吃到。',
  hint: {
    goal: '收集 3 颗随机出现的星星。星星吃完一颗后会在另一个随机位置出现。',
    tips: [
      '星星的位置是随机的，固定路线无法保证吃到。',
      '关键思路：让机器人像打印机一样逐行扫描整个地图，不遗漏任何格子。',
      '蛇形扫描（zigzag）：沿当前方向走到尽头，转向下一行，反向走，如此反复。',
      '5x5 地图每行走 4 步即可从一端到另一端，共 5 行。',
      '一次扫描可能只吃到 1 颗星星，需要重复扫描直到收集满 3 颗。',
      '用 for 循环控制扫描次数，避免代码过长。',
    ],
    api: [
      {
        name: 'robot.move_forward()',
        description: '沿当前朝向前进一格。经过星星所在格时会自动收集。',
      },
      {
        name: 'robot.turn_left() / robot.turn_right()',
        description: '原地左转或右转 90 度，不会前进。',
      },
      {
        name: 'robot.sense()',
        description: '检查机器人前方一格是什么。返回 wall 表示前方是边界或墙，empty 表示可走。',
        returns: 'wall、empty、target、collectible 等',
      },
      {
        name: 'for i in range(n):',
        description: '重复执行 n 次，可用于控制每行步数或扫描轮数。',
      },
      {
        name: 'def 函数名():',
        description: '把"走完一行"或"转向到下一行"封装成函数，让扫描逻辑更清晰。',
      },
    ],
  },
  intro: {
    title: '第七项任务：随机猎手',
    story: '训练场开始投放随机补给——星星会随机出现在地图的某个角落，吃完一颗，下一颗又会在别处出现。固定路线彻底没用了。你需要让机器人掌握一种"不遗漏任何角落"的搜索方式，像扫描仪一样系统地覆盖整张地图。只要策略正确，星星无论出现在哪，都逃不过你的机器人。',
    actionLabel: '开始任务',
  },
  gridSize: GRID_SIZE,
  start: { x: 0, y: 0, direction: 'right' },
  dynamicStarCount: STAR_TOTAL,
  collectibles: [],
  checkWin: checkRandomHunterWin,
  createSessionLevel: () => {
    const star = createInitialStar()
    return {
      ...randomHunterLevel,
      collectibles: star ? [star] : [],
    }
  },
  starterCode: `# 提示：星星的位置是随机的，固定路线无法保证吃到
# 思考：怎样走才能覆盖地图上的每一个格子？

def scan_row(steps):
    for i in range(steps):
        robot.move_forward()

def turn_to_next_row():
    # 转向到下一行，准备反向扫描
    pass

# 用循环重复扫描，直到收集满 3 颗星星
`,
  solutionCode: randomHunterSolution,
}
