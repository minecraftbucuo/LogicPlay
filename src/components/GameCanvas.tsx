import { useRef, useEffect } from 'react'
import { type RobotState, DIR_ANGLE, INITIAL_ROBOT, GRID_SIZE, CELL_SIZE, CANVAS_SIZE } from '../game/GameEngine'

// 画布样式常量
const LINE_WIDTH = 1

function GameCanvas({ robot = INITIAL_ROBOT }: { robot?: RobotState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
    const cx = robot.x * CELL_SIZE + CELL_SIZE / 2
    const cy = robot.y * CELL_SIZE + CELL_SIZE / 2
    const radius = CELL_SIZE * 0.35

    // 圆形身体
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
