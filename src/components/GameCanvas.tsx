import { useRef, useEffect, useState } from 'react'

// 网格配置
const GRID_SIZE = 5        // 5x5 网格
const CELL_SIZE = 60       // 每格 60px
const LINE_WIDTH = 1       // 网格线宽度
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE

// 方向：右、下、左、上（顺时针）
const DIRECTIONS = ['right', 'down', 'left', 'up'] as const
type Direction = typeof DIRECTIONS[number]

// 方向对应的角度（弧度），用于画箭头
const DIR_ANGLE: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
}

// 机器人状态
interface RobotState {
  x: number
  y: number
  direction: Direction
}

const INITIAL_ROBOT: RobotState = { x: 0, y: 2, direction: 'right' }

function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [robot] = useState<RobotState>(INITIAL_ROBOT)

  // 绘制机器人（带朝向箭头的圆形）
  const drawRobot = (ctx: CanvasRenderingContext2D, robot: RobotState) => {
    const cx = robot.x * CELL_SIZE + CELL_SIZE / 2
    const cy = robot.y * CELL_SIZE + CELL_SIZE / 2
    const radius = CELL_SIZE * 0.35

    // 画圆形身体
    ctx.fillStyle = '#00d4ff'
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()

    // 画朝向箭头
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

    // 箭头尖
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
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // 画背景
    ctx.fillStyle = '#16213e'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // 画网格线
    ctx.strokeStyle = '#0f3460'
    ctx.lineWidth = LINE_WIDTH

    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * CELL_SIZE

      // 竖线
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, CANVAS_SIZE)
      ctx.stroke()

      // 横线
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(CANVAS_SIZE, pos)
      ctx.stroke()
    }

    // 画机器人
    drawRobot(ctx, robot)
  }, [robot])

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
