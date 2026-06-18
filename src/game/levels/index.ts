import type { LevelData } from '../GameEngine'
import { basicMovementLevel } from './basicMovement'
import { basicDetourLevel } from './basicDetour'
import { placeholderStraightLineLevel } from './placeholderStraightLine'

export const LEVELS: LevelData[] = [
  basicMovementLevel,
  basicDetourLevel,
  placeholderStraightLineLevel,
]
