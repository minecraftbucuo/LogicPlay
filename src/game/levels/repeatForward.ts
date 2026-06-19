import type { LevelData } from '../GameEngine'

export const repeatForwardLevel: LevelData = {
  id: 'repeat-forward',
  name: '重复前进',
  description: '学习 for 循环，用更少的代码让机器人走更远。',
  hint: {
    goal: '用循环让机器人从最左侧走到同一行最右侧的终点。',
    tips: [
      '这一关距离很长，重复写很多行 move_forward() 会很麻烦。',
      'for i in range(n): 会把缩进里的代码重复执行 n 次。',
      'while 条件: 也可以重复执行代码，只要条件一直成立就会继续循环。',
      '这一关已经知道要走多少格，所以 for 循环更直接；以后路线不固定时可以考虑 while。',
      '机器人从 x=0 到 x=11，需要前进 11 格。',
    ],
    api: [
      {
        name: 'for i in range(n):',
        description: 'Python 循环语句，会重复执行下面缩进的代码块 n 次。适合已知重复次数的场景。',
      },
      {
        name: 'while 条件:',
        description: 'Python 循环语句。只要条件为 True，就会一直重复执行下面缩进的代码块。使用时要确保条件最终会变成 False，避免无限循环。',
      },
      {
        name: 'robot.move_forward()',
        description: '沿当前朝向前进一格，可以放在循环内部重复执行。',
      },
    ],
  },
  intro: {
    title: '第三项任务：重复执行',
    story: '训练场被扩展到了更远的距离。你当然可以一行一行写很多次 robot.move_forward()，但程序员会用更聪明的方式：for 循环可以让同一条指令重复执行。试着用循环，让机器人抵达远处的终点。',
    actionLabel: '开始任务',
  },
  gridSize: 12,
  start: { x: 0, y: 6, direction: 'right' },
  target: { x: 11, y: 6 },
  starterCode: '# 提示：用 for 循环重复执行前进\nfor i in range(3):\n    robot.move_forward()\n# 修改循环次数，让机器人走到终点',
  solutionCode: 'for i in range(11):\n    robot.move_forward()',
}
