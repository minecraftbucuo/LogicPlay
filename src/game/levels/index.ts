import type { LevelData } from '../GameEngine'
import { basicMovementLevel } from './basicMovement'
import { basicDetourLevel } from './basicDetour'

export const LEVELS: LevelData[] = [
  basicMovementLevel,
  basicDetourLevel,
]
