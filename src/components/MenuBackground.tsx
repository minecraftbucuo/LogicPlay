import { useRef, useEffect } from 'react'
import { DIRECTIONS, DIR_ANGLE, type RobotState } from '../game/GameEngine'

const ROBOT_START: RobotState = { x: 6, y: 4, direction: 'right' }

// 粒子
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
}

function MenuBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const robotRef = useRef<RobotState>({ ...ROBOT_START })
  const animFrameRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 全屏 Canvas
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gridCols = 12
    const gridRows = 8
    let cellSize = 0
    let offsetX = 0
    let offsetY = 0

    const recalcGrid = () => {
      cellSize = Math.floor(Math.min(canvas.width / gridCols, canvas.height / gridRows))
      offsetX = (canvas.width - gridCols * cellSize) / 2
      offsetY = (canvas.height - gridRows * cellSize) / 2
    }
    recalcGrid()

    let lastTime = 0
    let waitUntil = 0
    let animProgress = 1
    let fromPos = { x: ROBOT_START.x, y: ROBOT_START.y }
    let toPos = { x: ROBOT_START.x, y: ROBOT_START.y }

    // 随机选择下一个动作
    const pickNextAction = (robot: RobotState): { cmd: 'move_forward' | 'turn_left' | 'turn_right'; delay: number } => {
      const dx = robot.direction === 'right' ? 1 : robot.direction === 'left' ? -1 : 0
      const dy = robot.direction === 'down' ? 1 : robot.direction === 'up' ? -1 : 0
      const newX = robot.x + dx
      const newY = robot.y + dy
      const canMove = newX >= 0 && newX < gridCols && newY >= 0 && newY < gridRows

      const roll = Math.random()
      if (canMove && roll < 0.6) return { cmd: 'move_forward', delay: 600 + Math.random() * 400 }
      const turnDir = Math.random() < 0.5 ? 'turn_left' : 'turn_right'
      if (roll < 0.8 || !canMove) return { cmd: turnDir, delay: 350 + Math.random() * 200 }
      return { cmd: 'move_forward', delay: 600 + Math.random() * 400 }
    }

    // 初始化粒子
    const initParticles = () => {
      const ps: Particle[] = []
      for (let i = 0; i < 60; i++) {
        ps.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: Math.random() * 200,
          maxLife: 200 + Math.random() * 200,
          size: 1 + Math.random() * 2,
        })
      }
      return ps
    }
    particlesRef.current = initParticles()

    const spawnTrailParticles = (x: number, y: number) => {
      for (let i = 0; i < 5; i++) {
        particlesRef.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 0,
          maxLife: 40 + Math.random() * 40,
          size: 2 + Math.random() * 3,
        })
      }
    }

    const draw = (time: number) => {
      animFrameRef.current = requestAnimationFrame(draw)
      recalcGrid()

      // 执行随机动作
      if (animProgress >= 1 && time >= waitUntil) {
        const robot = robotRef.current
        const { cmd, delay } = pickNextAction(robot)

        if (cmd === 'move_forward') {
          const dx = robot.direction === 'right' ? 1 : robot.direction === 'left' ? -1 : 0
          const dy = robot.direction === 'down' ? 1 : robot.direction === 'up' ? -1 : 0
          const newX = robot.x + dx
          const newY = robot.y + dy

          if (newX >= 0 && newX < gridCols && newY >= 0 && newY < gridRows) {
            fromPos = { x: robot.x, y: robot.y }
            toPos = { x: newX, y: newY }
            animProgress = 0
            robotRef.current = { ...robot, x: newX, y: newY }
          }
        } else if (cmd === 'turn_left') {
          const idx = DIRECTIONS.indexOf(robot.direction)
          robotRef.current = { ...robot, direction: DIRECTIONS[(idx + 3) % 4] }
        } else if (cmd === 'turn_right') {
          const idx = DIRECTIONS.indexOf(robot.direction)
          robotRef.current = { ...robot, direction: DIRECTIONS[(idx + 1) % 4] }
        }

        waitUntil = time + delay
      }

      // 更新动画进度
      if (animProgress < 1) {
        const delta = lastTime ? (time - lastTime) / 500 : 0
        animProgress = Math.min(1, animProgress + delta)
      }
      lastTime = time

      // === 绘制 ===
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 背景渐变
      const bgGrad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      )
      bgGrad.addColorStop(0, '#0f0f2e')
      bgGrad.addColorStop(1, '#050510')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 网格线
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.06)'
      ctx.lineWidth = 1
      for (let i = 0; i <= gridCols; i++) {
        const x = offsetX + i * cellSize
        ctx.beginPath()
        ctx.moveTo(x, offsetY)
        ctx.lineTo(x, offsetY + gridRows * cellSize)
        ctx.stroke()
      }
      for (let j = 0; j <= gridRows; j++) {
        const y = offsetY + j * cellSize
        ctx.beginPath()
        ctx.moveTo(offsetX, y)
        ctx.lineTo(offsetX + gridCols * cellSize, y)
        ctx.stroke()
      }

      // 网格交叉点发光
      for (let i = 0; i <= gridCols; i++) {
        for (let j = 0; j <= gridRows; j++) {
          const x = offsetX + i * cellSize
          const y = offsetY + j * cellSize
          ctx.fillStyle = 'rgba(0, 212, 255, 0.08)'
          ctx.beginPath()
          ctx.arc(x, y, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // 机器人
      const easeProgress = animProgress < 1 ? animProgress * (2 - animProgress) : 1
      const robotPx = offsetX + (fromPos.x + (toPos.x - fromPos.x) * easeProgress) * cellSize + cellSize / 2
      const robotPy = offsetY + (fromPos.y + (toPos.y - fromPos.y) * easeProgress) * cellSize + cellSize / 2

      // 机器人发光
      const robotGlow = ctx.createRadialGradient(robotPx, robotPy, 0, robotPx, robotPy, cellSize * 0.8)
      robotGlow.addColorStop(0, 'rgba(0, 212, 255, 0.25)')
      robotGlow.addColorStop(1, 'rgba(0, 212, 255, 0)')
      ctx.fillStyle = robotGlow
      ctx.fillRect(robotPx - cellSize, robotPy - cellSize, cellSize * 2, cellSize * 2)

      // 移动时产生粒子
      if (animProgress < 1) {
        spawnTrailParticles(robotPx, robotPy)
      }

      // 机器人身体
      const radius = cellSize * 0.3
      ctx.fillStyle = '#00d4ff'
      ctx.shadowColor = '#00d4ff'
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.arc(robotPx, robotPy, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // 朝向箭头
      const angle = DIR_ANGLE[robotRef.current.direction]
      const arrowLen = radius * 0.7
      const tipX = robotPx + Math.cos(angle) * arrowLen
      const tipY = robotPy + Math.sin(angle) * arrowLen

      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(robotPx, robotPy)
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

      // 粒子
      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife)
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.life++
        const alpha = Math.max(0, 1 - p.life / p.maxLife)
        const particleRadius = Math.max(0.1, p.size * alpha)
        ctx.fillStyle = `rgba(0, 212, 255, ${alpha * 0.5})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, particleRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    animFrameRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}

export default MenuBackground
