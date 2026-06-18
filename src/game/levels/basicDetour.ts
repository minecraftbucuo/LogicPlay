import type { LevelData } from '../GameEngine'

export const basicDetourLevel: LevelData = {
  id: 'basic-detour',
  name: '绕过障碍',
  description: '学习左右转向，绕过中间的障碍物，到达绿色终点。',
  intro: {
    title: '第二项任务：学习转向',
    story: '训练场升起了第一道障碍墙。直线前进已经不够了，你需要让机器人学会转向：robot.turn_left() 可以向左转，robot.turn_right() 可以向右转。转向只会改变方向，不会前进。绕过障碍，抵达终点。',
    actionLabel: '开始任务',
  },
  gridSize: 5,
  start: { x: 0, y: 2, direction: 'right' },
  target: { x: 4, y: 2 },
  walls: [
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 2, y: 3 },
  ],
  starterCode: '# 提示：转向只会改变方向，不会前进\nrobot.move_forward()\nrobot.turn_right()\n# 继续绕过障碍，到达终点',
  solutionCode: 'robot.move_forward()\nrobot.turn_right()\nrobot.move_forward()\nrobot.move_forward()\nrobot.turn_left()\nrobot.move_forward()\nrobot.move_forward()\nrobot.turn_left()\nrobot.move_forward()\nrobot.move_forward()\nrobot.turn_right()\nrobot.move_forward()',
}
