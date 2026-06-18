import type { LevelData } from './GameEngine'

export const LEVELS: LevelData[] = [
  {
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
  },
  {
    id: 'placeholder-straight-line',
    name: '直线前进',
    description: '占位关卡：沿直线前进到达终点，用于验证关卡解锁流程。',
    gridSize: 5,
    start: { x: 0, y: 0, direction: 'right' },
    target: { x: 4, y: 0 },
    starterCode: '# 占位关卡：直线前进到终点\nrobot.move_forward()\nrobot.move_forward()\nrobot.move_forward()\nrobot.move_forward()',
  },
]

export function getLevelById(levelId: string): LevelData | undefined {
  return LEVELS.find(level => level.id === levelId)
}

export function getLevelIndex(levelId: string): number {
  return LEVELS.findIndex(level => level.id === levelId)
}

export function getFirstLevel(): LevelData {
  return LEVELS[0]
}

export function getNextLevel(levelId: string): LevelData | undefined {
  const index = getLevelIndex(levelId)
  if (index < 0) return undefined
  return LEVELS[index + 1]
}

export function isFirstLevel(levelId: string): boolean {
  return getLevelIndex(levelId) === 0
}
