import type { LevelData, LevelRuntimeState, RobotState, Collectible } from '../GameEngine'

const GRID_SIZE = 5
const STAR_TOTAL = 24

function checkSnakeOddWin(_robot: RobotState, runtime: LevelRuntimeState, level: LevelData): boolean {
  return runtime.collected.size >= (level.dynamicStarCount ?? STAR_TOTAL)
}

function createInitialStar(): Collectible | null {
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

const snakeOddSolution = `# 5x5 不存在哈密顿回路，用两个交替循环覆盖所有格子
# 坐标系：(行, 列)，1-indexed
# 循环A：从(2,1)回到(2,1)，覆盖24格（缺(2,2)）
# 循环B：从(2,1)回到(2,1)，覆盖24格（缺(1,1)）
# 交替 A+B 覆盖所有25格

def loop_a():
    robot.move_down()
    robot.move_down()
    robot.move_down()
    robot.move_right()
    robot.move_right()
    robot.move_right()
    robot.move_right()
    robot.move_up()
    robot.move_left()
    robot.move_left()
    robot.move_left()
    robot.move_up()
    robot.move_right()
    robot.move_right()
    robot.move_right()
    robot.move_up()
    robot.move_up()
    robot.move_left()
    robot.move_down()
    robot.move_left()
    robot.move_up()
    robot.move_left()
    robot.move_left()
    robot.move_down()

def loop_b():
    robot.move_down()
    robot.move_down()
    robot.move_down()
    robot.move_right()
    robot.move_right()
    robot.move_right()
    robot.move_right()
    robot.move_up()
    robot.move_left()
    robot.move_left()
    robot.move_left()
    robot.move_up()
    robot.move_right()
    robot.move_right()
    robot.move_right()
    robot.move_up()
    robot.move_up()
    robot.move_left()
    robot.move_down()
    robot.move_left()
    robot.move_up()
    robot.move_left()
    robot.move_down()
    robot.move_left()

# 先从起点(1,1)向下走到(2,1)
robot.move_down()
# 交替循环A和循环B，覆盖所有25格
for i in range(25):
    loop_a()
    loop_b()`

export const snakeOddLevel: LevelData = {
  id: 'snake-odd',
  name: '贪吃蛇·奇数困境',
  description: '5x5 地图不存在哈密顿回路，你需要找到新的策略。',
  hint: {
    goal: '收集 24 颗星星，蛇身占满整个 5x5 地图。每吃一颗星星蛇身增长一格。',
    tips: [
      '蛇会越来越长，不能撞到自己。',
      '5x5 地图两边都是奇数，不存在覆盖所有格子并回到起点的闭合循环路径。',
      '上次的循环策略失效了，需要想其他办法。',
      '思考：如果不能循环，是否可以设计一条不循环但能覆盖所有格子的路径？',
    ],
    api: [
      {
        name: 'robot.move_up() / move_down() / move_left() / move_right()',
        description: '直接朝指定方向移动一格（无需先转向）。经过星星所在格时会自动收集，蛇身增长一格。',
      },
      {
        name: 'robot.move_forward()',
        description: '沿当前朝向前进一格。也可用，但需要先 turn 设置朝向。',
      },
      {
        name: 'robot.turn_left() / robot.turn_right()',
        description: '原地左转或右转 90 度，不会前进。配合 move_forward 使用。',
      },
      {
        name: 'robot.sense()',
        description: '检查机器人前方一格是什么。返回 wall 表示前方是边界或墙。',
        returns: 'wall、empty、collectible 等',
      },
      {
        name: 'for i in range(n):',
        description: '重复执行 n 次。',
      },
      {
        name: 'def 函数名():',
        description: '把重复的逻辑封装成函数。',
      },
    ],
  },
  intro: {
    title: '第九项任务：贪吃蛇·奇数困境',
    story: '训练场缩小了，但规则没变——贪吃蛇模式，吃星星变长，不能撞到自己。这次地图只有 5x5，你需要收集 24 颗星星占满整个地图。上次的循环路径还能用吗？',
    actionLabel: '开始任务',
  },
  gridSize: GRID_SIZE,
  start: { x: 0, y: 0, direction: 'down' },
  snakeMode: true,
  dynamicStarCount: STAR_TOTAL,
  collectibles: [],
  checkWin: checkSnakeOddWin,
  createSessionLevel: () => {
    const star = createInitialStar()
    return {
      ...snakeOddLevel,
      collectibles: star ? [star] : [],
    }
  },
  starterCode: `# 提示：5x5 地图不存在哈密顿回路，循环策略失效了
# 思考：还有什么方法能让蛇占满整个地图？

def one_loop():
    pass

for loop in range(25):
    one_loop()
`,
  solutionCode: snakeOddSolution,
}
