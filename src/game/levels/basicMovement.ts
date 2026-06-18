import type { LevelData } from '../GameEngine'

export const basicMovementLevel: LevelData = {
  id: 'basic-movement',
  name: '基础移动',
  description: '学习最基础的移动，控制机器人到达绿色终点。',
  hint: {
    goal: '从起点一路向右走到绿色终点。',
    tips: [
      '机器人初始朝向右边。',
      '每调用一次 move_forward()，机器人会沿当前朝向前进一格。',
      '数一数起点到终点之间需要前进几格。',
    ],
    api: [
      {
        name: 'robot.move_forward()',
        description: '让机器人沿当前朝向前进一格。如果前方是墙或地图外，执行时会撞墙。',
      },
    ],
  },
  intro: {
    title: '第一项任务：启动移动协议',
    story: '欢迎来到 LogicPlay。你的机器人已经在训练场待命，但它还不会自己行动。现在，请写下最基础的移动指令，让机器人一步一步抵达绿色终点。',
    actionLabel: '开始任务',
  },
  gridSize: 5,
  start: { x: 0, y: 2, direction: 'right' },
  target: { x: 4, y: 2 },
  starterCode: '# 提示：机器人需要多次向前移动\nrobot.move_forward()\n# 继续补充代码，让机器人到达终点',
  solutionCode: 'robot.move_forward()\nrobot.move_forward()\nrobot.move_forward()\nrobot.move_forward()',
}
