import type { LevelData } from '../GameEngine'
import { basicMovementLevel } from './basicMovement'
import { basicDetourLevel } from './basicDetour'
import { repeatForwardLevel } from './repeatForward'
import { senseBranchLevel } from './senseBranch'
import { functionReuseLevel } from './functionReuse'

export const LEVELS: LevelData[] = [
  basicMovementLevel,
  basicDetourLevel,
  repeatForwardLevel,
  senseBranchLevel,
  functionReuseLevel,
]
