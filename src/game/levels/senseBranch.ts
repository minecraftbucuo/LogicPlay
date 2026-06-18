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
  hint: {
    goal: '找到神秘方块列里唯一的空气格，穿过去并到达右下角终点。',
    tips: [
      '整列 ? 方块每次只有一个是空气，其它都是墙，固定路线不可靠。',
      '先走到 ? 方块列前，再逐行检查前方。',
      '如果 robot.sense() 返回 wall，说明前方不能走，需要换下一行。',
      '如果返回 empty 或 target，说明前方可通过，可以穿过神秘方块列。',
    ],
    api: [
      {
        name: 'robot.sense()',
        description: '检查机器人前方一格是什么，不会移动机器人。',
        returns: '可能返回 wall、empty、target、collectible、switch、door、teleporter。第四关主要用 wall 和 empty。',
      },
      {
        name: "if robot.sense() == 'wall':",
        description: '条件判断语句。当前方是墙时执行 if 下面缩进的代码，否则可以进入 else 分支。',
      },
      {
        name: 'robot.turn_left() / robot.turn_right()',
        description: '原地左转或右转 90 度，不会前进。常用于换行或改变探索方向。',
      },
      {
        name: 'robot.move_forward()',
        description: '沿当前朝向前进一格。只有 sense 判断前方可走后再移动更安全。',
      },
    ],
  },
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
