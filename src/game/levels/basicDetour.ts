import type { LevelData } from '../GameEngine'

export const basicDetourLevel: LevelData = {
  id: 'basic-detour',
  name: '绕过障碍',
  description: '绕过中间的障碍物，到达绿色终点。',
  gridSize: 5,
  start: { x: 0, y: 2, direction: 'right' },
  target: { x: 4, y: 2 },
  walls: [
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 2, y: 3 },
  ],
  starterCode: '# 绕过障碍物走到终点\nrobot.move_forward()\nrobot.turn_right()\nrobot.move_forward()\nrobot.turn_left()\nrobot.move_forward()\nrobot.move_forward()\nrobot.turn_left()\nrobot.move_forward()\nrobot.turn_right()\nrobot.move_forward()',
}
