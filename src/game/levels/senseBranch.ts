import type { LevelData, Cell } from '../GameEngine'

const mysteryCells: Cell[] = Array.from({ length: 7 }, (_, y) => ({ x: 3, y }))

function createSenseBranchSession(): LevelData {
  const openingY = Math.floor(Math.random() * mysteryCells.length)
  const walls = mysteryCells.filter(cell => cell.y !== openingY)

  return {
    ...senseBranchLevel,
    walls,
    target: { x: 6, y: 6 },
  }
}

export const senseBranchLevel: LevelData = {
  id: 'sense-branch',
  name: '判断前方',
  description: '学习 if 条件分支，用感知结果寻找随机通路。',
  intro: {
    title: '第四项任务：条件判断',
    story: '训练场出现了一列神秘方块：它们看起来都一样，但每次任务开始时，只有一个方块其实是空气，其它都是墙。固定路线已经不可靠了，你需要用 robot.sense() 判断前方，再用 if 决定是否前进。',
    actionLabel: '开始任务',
  },
  gridSize: 7,
  start: { x: 0, y: 0, direction: 'right' },
  target: { x: 6, y: 0 },
  mysteryCells,
  createSessionLevel: createSenseBranchSession,
  starterCode: "# 提示：先走到神秘方块列前\nfor i in range(2):\n    robot.move_forward()\n\n# 提示：用 if 判断前方是不是墙\nif robot.sense() == 'wall':\n    robot.turn_right()\nelse:\n    robot.move_forward()",
  solutionCode: "for i in range(2):\n    robot.move_forward()\n\nfor row in range(7):\n    if robot.sense() == 'wall':\n        robot.turn_right()\n        robot.move_forward()\n        robot.turn_left()\n    else:\n        for step in range(4):\n            robot.move_forward()\n        robot.turn_right()\n        for step in range(6 - row):\n            robot.move_forward()\n        break",
}
