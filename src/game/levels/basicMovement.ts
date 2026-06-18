import type { LevelData } from '../GameEngine'

export const basicMovementLevel: LevelData = {
  id: 'basic-movement',
  name: '基础移动',
  description: '学习最基础的移动，控制机器人到达绿色终点。',
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
