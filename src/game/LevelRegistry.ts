import { LEVELS } from './levels'

export { LEVELS }

export function getLevelById(levelId: string) {
  return LEVELS.find(level => level.id === levelId)
}

export function getLevelIndex(levelId: string): number {
  return LEVELS.findIndex(level => level.id === levelId)
}

export function getFirstLevel() {
  return LEVELS[0]
}

export function getNextLevel(levelId: string) {
  const index = getLevelIndex(levelId)
  if (index < 0) return undefined
  return LEVELS[index + 1]
}

export function isFirstLevel(levelId: string): boolean {
  return getLevelIndex(levelId) === 0
}
