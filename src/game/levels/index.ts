import type { LevelData } from '../GameEngine'
import { basicMovementLevel } from './basicMovement'
import { basicDetourLevel } from './basicDetour'
import { repeatForwardLevel } from './repeatForward'

export const LEVELS: LevelData[] = [
  basicMovementLevel,
  basicDetourLevel,
  repeatForwardLevel,
]
