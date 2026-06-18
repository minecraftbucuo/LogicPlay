import type { LevelData } from '../GameEngine'
import { basicDetourLevel } from './basicDetour'
import { placeholderStraightLineLevel } from './placeholderStraightLine'

export const LEVELS: LevelData[] = [
  basicDetourLevel,
  placeholderStraightLineLevel,
]
