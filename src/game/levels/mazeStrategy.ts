import type { Cell, LevelData, LevelTestCase } from '../GameEngine'

// 用 DFS 挖路法生成真正的迷宫（保证起点到终点有路径）
// 使用网格迷宫结构：走廊格子按网格排列（间距为2），墙在走廊之间
function generateRealMaze(gridSize: number, startX: number, startY: number, endX: number, endY: number): Cell[] {
  // 网格迷宫：走廊格子间距为2，墙在走廊之间
  // 比如 9x9 网格，走廊格子位置为 (1,1), (1,3), (1,5), (1,7), (3,1), (3,3)...
  // 墙的位置为其他格子（但边界不一定是墙，让起点和终点可以在边界附近）

  // 调整起点和终点到走廊网格上（奇数坐标），且确保在有效范围内
  // 对于 gridSize=9，有效奇数坐标为 1,3,5,7
  const maxCoord = gridSize - 1

  // 调整到最近的奇数坐标（如果超出范围，用最大的奇数坐标）
  const toOddCoord = (n: number, max: number): number => {
    let adjusted = n % 2 === 0 ? n + 1 : n
    if (adjusted > max) {
      // 超出范围，用最大的奇数坐标
      adjusted = max % 2 === 0 ? max - 1 : max
    }
    return Math.max(1, adjusted) // 至少为1
  }

  const sx = toOddCoord(startX, maxCoord)
  const sy = toOddCoord(startY, maxCoord)
  const ex = toOddCoord(endX, maxCoord)
  const ey = toOddCoord(endY, maxCoord)

  // 初始化：所有格子都是墙
  const walls: Set<string> = new Set()
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      walls.add(`${x},${y}`)
    }
  }

  // DFS 挖路：从起点开始挖到终点
  const corridors: Set<string> = new Set()
  corridors.add(`${sx},${sy}`)
  walls.delete(`${sx},${sy}`)

  const stack: Cell[] = [{ x: sx, y: sy }]
  const visited: Set<string> = new Set([`${sx},${sy}`])

  // 走廊之间的移动步长为2（跳过中间的墙）
  const directions = [
    { dx: 0, dy: -2 }, // 上
    { dx: 2, dy: 0 },  // 右
    { dx: 0, dy: 2 },  // 下
    { dx: -2, dy: 0 }, // 左
  ]

  // DFS 挖出主路径到终点
  while (stack.length > 0) {
    const current = stack[stack.length - 1]

    // 如果到达终点，停止
    if (current.x === ex && current.y === ey) {
      break
    }

    // 找到未访问的邻居（走廊格子）
    const neighbors: Cell[] = []
    for (const dir of directions) {
      const nx = current.x + dir.dx
      const ny = current.y + dir.dy
      // 邻居必须在有效的走廊网格范围内（奇数坐标，1 到 gridSize-2）
      if (nx >= 1 && nx <= maxCoord - 1 && ny >= 1 && ny <= maxCoord - 1 && !visited.has(`${nx},${ny}`)) {
        neighbors.push({ x: nx, y: ny })
      }
    }

    if (neighbors.length === 0) {
      // 回溯
      stack.pop()
    } else {
      // 随机选择一个邻居
      const next = neighbors[Math.floor(Math.random() * neighbors.length)]

      // 挖出走廊格子
      visited.add(`${next.x},${next.y}`)
      corridors.add(`${next.x},${next.y}`)
      walls.delete(`${next.x},${next.y}`)

      // 挖出中间的墙（连接两个走廊格子）
      const midX = current.x + (next.x - current.x) / 2
      const midY = current.y + (next.y - current.y) / 2
      walls.delete(`${midX},${midY}`)

      stack.push(next)
    }
  }

  // 继续挖出一些随机分支（形成死胡同）
  const corridorArray = Array.from(visited)
  const extraBranches = Math.floor(corridorArray.length * 0.3)

  for (let i = 0; i < extraBranches; i++) {
    const randomIdx = Math.floor(Math.random() * corridorArray.length)
    const [cx, cy] = corridorArray[randomIdx].split(',').map(Number)

    // 尝试挖一段分支
    for (const dir of directions) {
      const nx = cx + dir.dx
      const ny = cy + dir.dy
      if (nx >= 1 && nx <= maxCoord - 1 && ny >= 1 && ny <= maxCoord - 1 && !visited.has(`${nx},${ny}`)) {
        visited.add(`${nx},${ny}`)
        corridors.add(`${nx},${ny}`)
        walls.delete(`${nx},${ny}`)

        const midX = cx + (nx - cx) / 2
        const midY = cy + (ny - cy) / 2
        walls.delete(`${midX},${midY}`)

        break // 每个起点只挖一个分支
      }
    }
  }

  // 确保起点和终点不是墙
  walls.delete(`${sx},${sy}`)
  walls.delete(`${ex},${ey}`)

  // 返回墙的数组
  return Array.from(walls).map(s => {
    const [x, y] = s.split(',').map(Number)
    return { x, y }
  })
}

function createMazeTestCase(name: string, gridSize: number, start: Cell, end: Cell): LevelTestCase {
  const walls = generateRealMaze(gridSize, start.x, start.y, end.x, end.y)

  const maxCoord = gridSize - 1
  const toOddCoord = (n: number, max: number): number => {
    let adjusted = n % 2 === 0 ? n + 1 : n
    if (adjusted > max) {
      adjusted = max % 2 === 0 ? max - 1 : max
    }
    return Math.max(1, adjusted)
  }

  const sx = toOddCoord(start.x, maxCoord)
  const sy = toOddCoord(start.y, maxCoord)
  const ex = toOddCoord(end.x, maxCoord)
  const ey = toOddCoord(end.y, maxCoord)

  return {
    name,
    start: { x: sx, y: sy, direction: 'right' },
    target: { x: ex, y: ey },
    walls,
  }
}

// 动态生成迷宫测试用例（每次调用都会重新生成）
function generateMazeTestCases(): LevelTestCase[] {
  return [
    createMazeTestCase('入门迷宫', 9, { x: 0, y: 1 }, { x: 8, y: 7 }),
    createMazeTestCase('转弯迷宫', 9, { x: 0, y: 7 }, { x: 8, y: 3 }),
    createMazeTestCase('复杂迷宫', 9, { x: 0, y: 4 }, { x: 8, y: 8 }),
  ]
}

export const mazeStrategyLevel: LevelData = {
  id: 'maze-strategy',
  name: '迷宫策略',
  description: '用同一套贴墙走策略通过多张迷宫测试图。',
  hint: {
    goal: '让同一份代码通过所有迷宫测试用例。',
    tips: [
      '这一关不是写死路线，而是写一套通用策略。',
      '右手法则的核心是：先看右侧，右侧能走就右转并前进。',
      '如果右侧不能走，再看前方；前方能走就前进。',
      '如果右侧和前方都不能走，就左转继续找路。',
      '可以用 for step in range(200): 给策略一个安全执行上限。',
    ],
    api: [
      {
        name: 'robot.sense()',
        description: '检查机器人前方一格是什么，不会移动机器人。',
        returns: '可能返回 wall、empty、target、collectible、switch、door、teleporter。迷宫关主要使用 wall、empty、target。',
      },
      {
        name: 'robot.turn_right()',
        description: '原地右转 90 度，可用于临时检查右侧。',
      },
      {
        name: 'robot.turn_left()',
        description: '原地左转 90 度，可用于恢复方向或在死胡同时换方向。',
      },
      {
        name: 'for step in range(n):',
        description: '重复执行策略 n 次，避免 while 写错后进入死循环。',
      },
    ],
  },
  intro: {
    title: '第六项任务：迷宫策略',
    story: '训练场不再只有一张地图。接下来，机器人会面对多张不同迷宫；写死路线已经彻底失效。你需要写出一套通用策略：观察前方、决定转向、沿着墙走。只要策略正确，换一张迷宫也能走到终点。',
    actionLabel: '开始任务',
  },
  gridSize: 9,
  start: { x: 1, y: 1, direction: 'right' }, // 默认起点，实际会被 createSessionLevel 覆盖
  target: { x: 7, y: 7 }, // 默认终点，实际会被 createSessionLevel 覆盖
  walls: [], // 默认无墙，实际会被 createSessionLevel 覆盖
  testCases: [], // 默认空，实际会被 createSessionLevel 覆盖
  createSessionLevel: () => {
    const testCases = generateMazeTestCases()
    const firstMaze = testCases[0]
    return {
      ...mazeStrategyLevel,
      start: firstMaze.start,
      target: firstMaze.target,
      walls: firstMaze.walls,
      testCases,
    }
  },
  starterCode: `# 提示：同一份代码会在多张迷宫里测试
# 试着实现右手贴墙走策略

def follow_wall():
    robot.turn_right()
    if robot.sense() != 'wall':
        # 右侧可以走
        pass
    else:
        # 右侧不能走，回到原方向再判断前方
        robot.turn_left()

for step in range(200):
    follow_wall()`,
  solutionCode: `def follow_wall():
    robot.turn_right()
    if robot.sense() != 'wall':
        robot.move_forward()
    else:
        robot.turn_left()
        if robot.sense() != 'wall':
            robot.move_forward()
        else:
            robot.turn_left()

for step in range(200):
    follow_wall()`,
}
