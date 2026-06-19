import type { LevelData, LevelRuntimeState, RobotState } from '../GameEngine'

function hasCollectedAllStars(runtime: LevelRuntimeState, level: LevelData): boolean {
  return (level.collectibles ?? []).every(collectible => runtime.collected.has(collectible.id))
}

function checkFunctionReuseWin(robot: RobotState, runtime: LevelRuntimeState, level: LevelData): boolean {
  return robot.x === level.target?.x && robot.y === level.target?.y && hasCollectedAllStars(runtime, level)
}

const bypassGateSolution = `def bypass_gate():
    robot.turn_left()
    for step in range(2):
        robot.move_forward()
    robot.turn_right()
    for step in range(3):
        robot.move_forward()
    robot.turn_right()
    for step in range(2):
        robot.move_forward()
    robot.turn_left()

bypass_gate()
bypass_gate()
bypass_gate()

for step in range(2):
    robot.move_forward()`

export const functionReuseLevel: LevelData = {
  id: 'function-reuse',
  name: '封装动作',
  description: '学习定义函数，把重复出现的绕行动作封装起来反复使用。',
  hint: {
    goal: '绕过三组相同的障碍门，收集每个门后的星星，再到达右侧终点。',
    tips: [
      '每组障碍门后方都有一颗星星，必须全部收集后才能通关。',
      '三组障碍结构完全一样，收集星星需要重复执行同一套绕行动作。',
      'def bypass_gate(): 可以给这套绕行动作起名字，然后多次调用。',
      '函数定义后不会自动执行，必须写 bypass_gate() 才会真正运行。',
      '函数体内部也可以继续使用 for 循环，让连续前进更简洁。',
    ],
    api: [
      {
        name: 'def 函数名():',
        description: '定义一个函数。冒号下面缩进的代码属于函数体，用来保存一组可复用动作。',
      },
      {
        name: '函数名()',
        description: '调用函数。只有调用时，函数体里的代码才会执行。',
      },
      {
        name: 'for i in range(n):',
        description: '重复执行缩进代码块 n 次，可以放在函数内部。',
      },
      {
        name: 'robot.turn_left() / robot.turn_right()',
        description: '原地左转或右转 90 度，不会前进。',
      },
      {
        name: 'robot.move_forward()',
        description: '沿当前朝向前进一格。经过星星所在格时会自动收集。',
      },
    ],
  },
  intro: {
    title: '第五项任务：封装重复动作',
    story: '训练场出现了三组一模一样的障碍门，每个门后方都藏着一颗星星。只有收集全部星星并抵达终点，任务才算完成。把绕过一组门并拿到星星的动作封装成 bypass_gate()，然后在每组障碍前重复调用它。',
    actionLabel: '开始任务',
  },
  gridSize: 12,
  start: { x: 0, y: 8, direction: 'right' },
  target: { x: 11, y: 8 },
  checkWin: checkFunctionReuseWin,
  walls: [
    { x: 2, y: 7 },
    { x: 2, y: 8 },
    { x: 2, y: 9 },
    { x: 5, y: 7 },
    { x: 5, y: 8 },
    { x: 5, y: 9 },
    { x: 8, y: 7 },
    { x: 8, y: 8 },
    { x: 8, y: 9 },
  ],
  collectibles: [
    { id: 'gate-star-1', x: 3, y: 8 },
    { id: 'gate-star-2', x: 6, y: 8 },
    { id: 'gate-star-3', x: 9, y: 8 },
  ],
  starterCode: `# 提示：把“绕过一组门并拿到星星”的动作封装成函数
def bypass_gate():
    robot.turn_left()
    # 在这里补完整绕行动作

# 每组门后都有星星，重复调用函数会更清晰
bypass_gate()
bypass_gate()
bypass_gate()`,
  solutionCode: bypassGateSolution,
}
