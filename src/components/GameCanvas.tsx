import { useRef, useEffect } from 'react'
import { type RobotState, type LevelData, DIR_ANGLE, DEFAULT_LEVEL, GRID_SIZE, CELL_SIZE, CANVAS_SIZE } from '../game/GameEngine'

// 画布样式常量
const LINE_WIDTH = 1

function GameCanvas({ robot, level = DEFAULT_LEVEL }: { robot?: RobotState; level?: LevelData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const currentRobot = robot ?? level.start

    // 清空画布
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // 画背景
    ctx.fillStyle = '#16213e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // 画障碍物（深红色方块）
    for (const wall of level.walls) {
      ctx.fillStyle = '#c0392b'
      ctx.fillRect(wall.x * CELL_SIZE + 2, wall.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4)
    }

    // 画终点（绿色旗帜标记）
    const tx = level.target.x * CELL_SIZE + CELL_SIZE / 2
    const ty = level.target.y * CELL_SIZE + CELL_SIZE / 2
    ctx.fillStyle = '#2ecc71'
    ctx.beginPath()
    ctx.arc(tx, ty, CELL_SIZE * 0.3, 0, Math.PI * 2)
    ctx.fill()
    // 画星号表示终点
    ctx.fillStyle = '#16213e'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('★', tx, ty)

    // 画网格线
    ctx.strokeStyle = '#0f3460'
    ctx.lineWidth = LINE_WIDTH

    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * CELL_SIZE

      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, CANVAS_SIZE)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(CANVAS_SIZE, pos)
      ctx.stroke()
    }

    // 画机器人
    const cx = currentRobot.x * CELL_SIZE + CELL_SIZE / 2
    const cy = currentRobot.y * CELL_SIZE + CELL_SIZE / 2
    const radius = CELL_SIZE * 0.35

    // 圆形身体
    ctx.fillStyle = '#00d4ff'
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()

    // 朝向箭头
    const angle = DIR_ANGLE[currentRobot.direction]
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
  }, [robot, level])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      style={{ border: '2px solid #0f3460', borderRadius: '4px' }}
    />
  )
}

export default GameCanvas
