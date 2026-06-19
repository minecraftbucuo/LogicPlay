import type { Cell, LevelData, LevelTestCase } from '../GameEngine'

function createMazeWalls(gridSize: number, path: Cell[]): Cell[] {
  const pathSet = new Set(path.map(cell => `${cell.x},${cell.y}`))
  const walls: Cell[] = []

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!pathSet.has(`${x},${y}`)) {
        walls.push({ x, y })
      }
    }
  }

  return walls
}

function createMazeTestCase(name: string, path: Cell[]): LevelTestCase {
  return {
    name,
    start: { ...path[0], direction: 'right' },
    target: path[path.length - 1],
    walls: createMazeWalls(9, path),
  }
}

const mazeTestCases: LevelTestCase[] = [
  createMazeTestCase('入门迷宫', [
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 3, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 5, y: 3 },
    { x: 5, y: 4 },
    { x: 5, y: 5 },
    { x: 6, y: 5 },
    { x: 7, y: 5 },
    { x: 7, y: 6 },
    { x: 7, y: 7 },
    { x: 8, y: 7 },
  ]),
  createMazeTestCase('转弯迷宫', [
    { x: 0, y: 7 },
    { x: 1, y: 7 },
    { x: 1, y: 6 },
    { x: 1, y: 5 },
    { x: 2, y: 5 },
    { x: 3, y: 5 },
    { x: 3, y: 4 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 5, y: 3 },
    { x: 5, y: 2 },
    { x: 5, y: 1 },
    { x: 6, y: 1 },
    { x: 7, y: 1 },
    { x: 7, y: 2 },
    { x: 7, y: 3 },
    { x: 8, y: 3 },
  ]),
  createMazeTestCase('长走廊迷宫', [
    { x: 0, y: 4 },
    { x: 1, y: 4 },
    { x: 2, y: 4 },
    { x: 3, y: 4 },
    { x: 4, y: 4 },
    { x: 5, y: 4 },
    { x: 6, y: 4 },
    { x: 7, y: 4 },
    { x: 7, y: 5 },
    { x: 7, y: 6 },
    { x: 6, y: 6 },
    { x: 5, y: 6 },
    { x: 4, y: 6 },
    { x: 3, y: 6 },
    { x: 3, y: 7 },
    { x: 3, y: 8 },
    { x: 4, y: 8 },
    { x: 5, y: 8 },
    { x: 6, y: 8 },
    { x: 7, y: 8 },
    { x: 8, y: 8 },
  ]),
]

const firstMaze = mazeTestCases[0]

export const mazeStrategyLevel: LevelData = {
  id: 'maze-strategy',
  name: '迷宫策略',
  description: '用同一套贴墙走策略通过多张迷宫测试图。',
  hint: {
    goal: '让同一份代码通过所有迷宫测试用例。',
    tips: [
      '这一关不是写死路线，而是写一套通用策略。',
      '右手法则的核心是：先看右侧，右侧能走就右转并前进。',
      '如果右侧不能走，再看前方；前方能走就前进。',
      '如果右侧和前方都不能走，就左转继续找路。',
      '可以用 for step in range(200): 给策略一个安全执行上限。',
    ],
    api: [
      {
        name: 'robot.sense()',
        description: '检查机器人前方一格是什么，不会移动机器人。',
        returns: '可能返回 wall、empty、target、collectible、switch、door、teleporter。迷宫关主要使用 wall、empty、target。',
      },
      {
        name: 'robot.turn_right()',
        description: '原地右转 90 度，可用于临时检查右侧。',
      },
      {
        name: 'robot.turn_left()',
        description: '原地左转 90 度，可用于恢复方向或在死胡同时换方向。',
      },
      {
        name: 'for step in range(n):',
        description: '重复执行策略 n 次，避免 while 写错后进入死循环。',
      },
    ],
  },
  intro: {
    title: '第六项任务：迷宫策略',
    story: '训练场不再只有一张地图。接下来，机器人会面对多张不同迷宫；写死路线已经彻底失效。你需要写出一套通用策略：观察前方、决定转向、沿着墙走。只要策略正确，换一张迷宫也能走到终点。',
    actionLabel: '开始任务',
  },
  gridSize: 9,
  start: firstMaze.start,
  target: firstMaze.target,
  walls: firstMaze.walls,
  testCases: mazeTestCases,
  starterCode: `# 提示：同一份代码会在多张迷宫里测试
# 试着实现右手贴墙走策略

def follow_wall():
    robot.turn_right()
    if robot.sense() != 'wall':
        # 右侧可以走
        pass
    else:
        # 右侧不能走，回到原方向再判断前方
        robot.turn_left()

for step in range(200):
    follow_wall()`,
  solutionCode: `def follow_wall():
    robot.turn_right()
    if robot.sense() != 'wall':
        robot.move_forward()
    else:
        robot.turn_left()
        if robot.sense() != 'wall':
            robot.move_forward()
        else:
            robot.turn_left()

for step in range(200):
    follow_wall()`,
}
