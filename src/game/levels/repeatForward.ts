import type { LevelData } from '../GameEngine'

export const repeatForwardLevel: LevelData = {
  id: 'repeat-forward',
  name: '重复前进',
  description: '学习 for 循环，用更少的代码让机器人走更远。',
  intro: {
    title: '第三项任务：重复执行',
    story: '训练场被扩展到了更远的距离。你当然可以一行一行写很多次 robot.move_forward()，但程序员会用更聪明的方式：for 循环可以让同一条指令重复执行。试着用循环，让机器人抵达远处的终点。',
    actionLabel: '开始任务',
  },
  gridSize: 12,
  start: { x: 0, y: 6, direction: 'right' },
  target: { x: 11, y: 6 },
  starterCode: '# 使用循环重复前进\nfor i in range(5):\n    robot.move_forward()',
}
