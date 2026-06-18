import type { LevelData } from '../GameEngine'

export const placeholderStraightLineLevel: LevelData = {
  id: 'placeholder-straight-line',
  name: '直线前进',
  description: '占位关卡：沿直线前进到达终点，用于验证关卡解锁流程。',
  gridSize: 5,
  start: { x: 0, y: 0, direction: 'right' },
  target: { x: 4, y: 0 },
  starterCode: '# 占位关卡：直线前进到终点\nrobot.move_forward()\nrobot.move_forward()\nrobot.move_forward()\nrobot.move_forward()',
}
