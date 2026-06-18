import { LEVELS, getLevelIndex } from './LevelRegistry'

const STORAGE_KEY = 'logicplay-progress-v1'

export interface GameProgress {
  completedLevelIds: string[]
}

function getDefaultProgress(): GameProgress {
  return {
    completedLevelIds: [],
  }
}

export function loadProgress(): GameProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultProgress()

    const parsed = JSON.parse(raw) as Partial<GameProgress>
    return {
      completedLevelIds: Array.isArray(parsed.completedLevelIds) ? parsed.completedLevelIds : [],
    }
  } catch {
    return getDefaultProgress()
  }
}

export function saveProgress(progress: GameProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function isLevelCompleted(levelId: string, progress: GameProgress): boolean {
  return progress.completedLevelIds.includes(levelId)
}

export function isLevelUnlocked(levelId: string, progress: GameProgress): boolean {
  const levelIndex = getLevelIndex(levelId)
  if (levelIndex <= 0) return levelIndex === 0

  const previousLevel = LEVELS[levelIndex - 1]
  return previousLevel ? isLevelCompleted(previousLevel.id, progress) : false
}

export function completeLevel(levelId: string): GameProgress {
  const progress = loadProgress()
  if (!progress.completedLevelIds.includes(levelId)) {
    progress.completedLevelIds.push(levelId)
    saveProgress(progress)
  }
  return progress
}

export function resetProgress(): GameProgress {
  const progress = getDefaultProgress()
  saveProgress(progress)
  return progress
}
