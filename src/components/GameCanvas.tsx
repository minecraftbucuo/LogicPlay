import { useRef, useEffect } from 'react'

// 网格配置
const GRID_SIZE = 5        // 5x5 网格
const CELL_SIZE = 60       // 每格 60px
const LINE_WIDTH = 1       // 网格线宽度
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE

function GameCanvas() {
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
  }, [])

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
