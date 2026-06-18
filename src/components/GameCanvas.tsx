import { useRef, useEffect } from 'react'
import {
  type RobotState,
  type LevelData,
  type LevelRuntimeState,
  DIR_ANGLE,
  DEFAULT_CELL_SIZE,
  getCanvasSize,
  createRuntimeState,
} from '../game/GameEngine'

function GameCanvas({
  robot,
  level,
  runtime,
}: {
  robot: RobotState
  level: LevelData
  runtime?: LevelRuntimeState
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cellSize = DEFAULT_CELL_SIZE
    const canvasSize = getCanvasSize(level)
    const rt = runtime ?? createRuntimeState()

    // 清空画布
    ctx.clearRect(0, 0, canvasSize, canvasSize)

    // 画背景
    ctx.fillStyle = '#16213e'
    ctx.fillRect(0, 0, canvasSize, canvasSize)

    // 画网格线
    ctx.strokeStyle = '#0f3460'
    ctx.lineWidth = 1
    for (let i = 0; i <= level.gridSize; i++) {
      const pos = i * cellSize
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, canvasSize)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(canvasSize, pos)
      ctx.stroke()
    }

    // 画障碍物（深红色方块）
    for (const wall of level.walls ?? []) {
      ctx.fillStyle = '#c0392b'
      ctx.fillRect(wall.x * cellSize + 2, wall.y * cellSize + 2, cellSize - 4, cellSize - 4)
    }

    // 画门（关闭的门画紫色，打开的门画半透明）
    for (const door of level.doors ?? []) {
      const isOpen = rt.openedDoors.has(door.id)
      if (isOpen) {
        ctx.fillStyle = 'rgba(155, 89, 182, 0.2)'
        ctx.strokeStyle = 'rgba(155, 89, 182, 0.4)'
      } else {
        ctx.fillStyle = '#9b59b6'
        ctx.strokeStyle = '#7d3c98'
      }
      ctx.fillRect(door.x * cellSize + 4, door.y * cellSize + 4, cellSize - 8, cellSize - 8)
      ctx.strokeRect(door.x * cellSize + 4, door.y * cellSize + 4, cellSize - 8, cellSize - 8)
    }

    // 画开关（橙色小圆点）
    for (const sw of level.switches ?? []) {
      const isActivated = rt.activatedSwitches.has(sw.id)
      const sx = sw.x * cellSize + cellSize / 2
      const sy = sw.y * cellSize + cellSize / 2
      ctx.fillStyle = isActivated ? '#f39c12' : '#555'
      ctx.beginPath()
      ctx.arc(sx, sy, cellSize * 0.15, 0, Math.PI * 2)
      ctx.fill()
      if (isActivated) {
        ctx.strokeStyle = '#f39c12'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(sx, sy, cellSize * 0.22, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // 画收集品（金色星星）
    for (const col of level.collectibles ?? []) {
      if (rt.collected.has(col.id)) continue
      const cx = col.x * cellSize + cellSize / 2
      const cy = col.y * cellSize + cellSize / 2
      ctx.fillStyle = '#f1c40f'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('★', cx, cy)
    }

    // 画传送点（紫色漩涡）
    for (const tp of level.teleporters ?? []) {
      const tx = tp.x * cellSize + cellSize / 2
      const ty = tp.y * cellSize + cellSize / 2
      ctx.strokeStyle = '#9b59b6'
      ctx.lineWidth = 2
      for (let r = 0.1; r <= 0.3; r += 0.1) {
        ctx.beginPath()
        ctx.arc(tx, ty, cellSize * r, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // 画终点（绿色旗帜标记）
    if (level.target) {
      const tx = level.target.x * cellSize + cellSize / 2
      const ty = level.target.y * cellSize + cellSize / 2
      ctx.fillStyle = '#2ecc71'
      ctx.beginPath()
      ctx.arc(tx, ty, cellSize * 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#16213e'
      ctx.font = 'bold 20px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('★', tx, ty)
    }

    // 画机器人
    const cx = robot.x * cellSize + cellSize / 2
    const cy = robot.y * cellSize + cellSize / 2
    const radius = cellSize * 0.35

    ctx.fillStyle = '#00d4ff'
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()

    // 朝向箭头
    const angle = DIR_ANGLE[robot.direction]
    const arrowLen = radius * 0.7
    const tipX = cx + Math.cos(angle) * arrowLen
    const tipY = cy + Math.sin(angle) * arrowLen

    ctx.strokeStyle = '#1a1a2e'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(tipX, tipY)
    ctx.stroke()

    const headLen = 8
    ctx.beginPath()
    ctx.moveTo(tipX, tipY)
    ctx.lineTo(
      tipX - headLen * Math.cos(angle - Math.PI / 6),
      tipY - headLen * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(tipX, tipY)
    ctx.lineTo(
      tipX - headLen * Math.cos(angle + Math.PI / 6),
      tipY - headLen * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
  }, [robot, level, runtime])

  const canvasSize = getCanvasSize(level)

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      style={{ border: '2px solid #0f3460', borderRadius: '4px' }}
    />
  )
}

export default GameCanvas
