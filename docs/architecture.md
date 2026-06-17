# LogicPlay 技术架构文档

## 1. 系统架构概览

```
┌─────────────────────────────────────────────┐
│                  浏览器                       │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ 游戏画面  │  │ 代码编辑器│  │ 关卡系统   │ │
│  │ (Canvas) │  │(Monaco/  │  │           │ │
│  │          │  │ CodeMirror)│  │           │ │
│  └────┬─────┘  └─────┬────┘  └─────┬─────┘ │
│       │              │              │        │
│  ┌────▼──────────────▼──────────────▼─────┐ │
│  │            游戏引擎 (Core)              │ │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ │ │
│  │  │ 地图系统 │ │ 机器人   │ │ 动画系统  │ │ │
│  │  │         │ │ 控制器   │ │          │ │ │
│  │  └─────────┘ └────┬────┘ └──────────┘ │ │
│  │                   │                    │ │
│  │  ┌────────────────▼─────────────────┐ │ │
│  │  │       Pyodide 沙箱执行器          │ │ │
│  │  │  (解析玩家Python代码 → 控制指令)   │ │ │
│  │  └──────────────────────────────────┘ │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 2. 核心模块

### 2.1 游戏引擎 (Core)
- **地图系统**: 管理网格地图、障碍物、目标点等
- **机器人控制器**: 接收指令，驱动机器人在地图上移动
- **动画系统**: 处理机器人移动动画、特效等
- **碰撞检测**: 判断机器人是否撞墙、到达目标等

### 2.2 代码编辑器
- 提供代码输入区域
- 语法高亮（Python）
- 代码提示（可选，后续迭代）
- 运行/停止/重置按钮

### 2.3 Pyodide 沙箱执行器
- 在浏览器中加载 Pyodide 运行时
- 将玩家代码注入沙箱执行
- 暴露游戏 API 给玩家（如 `move_forward()`, `turn_left()` 等）
- 捕获输出和错误信息
- 支持步进执行（每步暂停，等待动画完成）

### 2.4 关卡系统
- 关卡数据定义（地图布局、目标、限制条件）
- 关卡加载与切换
- 关卡完成判定
- 进度保存（localStorage）

### 2.5 游戏画面 (Canvas)
- 网格地图渲染
- 机器人渲染与动画
- UI 叠加层（提示、得分等）

## 3. 玩家 API 设计（初步）

玩家通过 Python 代码控制机器人，核心 API：

```python
# 基础移动
robot.move_forward()    # 向前走一格
robot.turn_left()       # 左转 90 度
robot.turn_right()      # 右转 90 度

# 感知
robot.can_move_forward()  # 前方是否可走
robot.can_move_left()     # 左方是否可走
robot.can_move_right()    # 右方是否可走
robot.is_at_goal()        # 是否到达目标

# 后续扩展
robot.detect_wall()       # 检测前方墙壁距离
robot.pick_up()           # 捡起物品
robot.put_down()          # 放下物品
```

## 4. 关卡数据结构（初步）

```json
{
  "id": "level_001",
  "name": "第一步",
  "description": "让机器人走到目标点",
  "grid": {
    "width": 5,
    "height": 5
  },
  "robot": {
    "x": 0,
    "y": 2,
    "direction": "right"
  },
  "goal": {
    "x": 4,
    "y": 2
  },
  "walls": [[2, 1], [2, 2]],
  "hint": "试试用 robot.move_forward() 让机器人前进",
  "star_conditions": {
    "1": "到达目标",
    "2": "代码不超过5行",
    "3": "代码不超过3行"
  }
}
```

## 5. 技术栈详情

| 层面 | 技术 | 说明 |
|------|------|------|
| 构建工具 | Vite | 快速开发，HMR 支持 |
| UI 框架 | React 18+ | 组件化开发 |
| 状态管理 | Zustand（或后续决定） | 轻量级状态管理 |
| 游戏渲染 | HTML5 Canvas 2D | 像素风格渲染 |
| 代码编辑器 | CodeMirror 6 | 轻量，Python 语法支持好 |
| Python 执行 | Pyodide | 浏览器端 Python 运行时 |
| 样式 | CSS Modules / Tailwind | 待定 |
| 语言 | TypeScript | 类型安全 |

## 6. 项目目录结构

```
LogicPlay/
├── CONVENTIONS.md              # 开发规范
├── docs/                       # 设计文档
│   └── architecture.md         # 本文件
├── public/                     # 静态资源
│   └── assets/                 # 图片、精灵图等
├── src/
│   ├── main.tsx                # 入口
│   ├── App.tsx                 # 根组件
│   ├── core/                   # 游戏引擎核心
│   │   ├── GameEngine.ts       # 引擎主类
│   │   ├── MapSystem.ts        # 地图系统
│   │   ├── RobotController.ts  # 机器人控制
│   │   └── AnimationSystem.ts  # 动画系统
│   ├── sandbox/                # Pyodide 沙箱
│   │   └── PyodideRunner.ts    # Python 执行器
│   ├── levels/                 # 关卡数据
│   │   └── levelData.ts        # 关卡定义
│   ├── components/             # React 组件
│   │   ├── GameCanvas.tsx      # 游戏画布
│   │   ├── CodeEditor.tsx      # 代码编辑器
│   │   ├── LevelSelector.tsx   # 关卡选择
│   │   └── GameUI.tsx          # 游戏UI
│   └── types/                  # TypeScript 类型
│       └── index.ts            # 类型定义
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 7. 开发路线（分阶段）

### Phase 1: 最小可玩原型（逐步实现，每步独立可验证）

**Step 1.1**: 项目初始化
- 用 Vite 创建 React + TypeScript 项目
- 验证：`npm run dev` 能跑起来，浏览器看到默认页面

**Step 1.2**: Canvas 渲染网格地图
- 创建 GameCanvas 组件，用 Canvas 2D 画一个 5x5 网格
- 验证：浏览器看到网格线

**Step 1.3**: 在地图上渲染机器人
- 在网格中某个位置画一个代表机器人的方块/图形
- 验证：网格上能看到机器人

**Step 1.4**: 基础代码输入区域
- 添加一个 textarea 和"运行"按钮
- 验证：能输入文字，点击按钮能获取输入内容

**Step 1.5**: 加载 Pyodide
- 页面加载时初始化 Pyodide 运行时
- 验证：能执行简单 Python 代码（如 `1+1`）并获取结果

**Step 1.6**: 连通 Python 与游戏
- 在 Pyodide 中注入 `robot` 对象，玩家调用 `robot.move_forward()` 时生成指令
- 指令传回 JS 端，驱动机器人在地图上移动一格
- 验证：输入 `robot.move_forward()` 点击运行，机器人向前走一格

### Phase 2: 完善核心玩法
- 左转、右转 API
- 碰撞检测（撞墙）
- 目标判定（到达终点）
- 第一个完整关卡

### Phase 3: 关卡系统
- 关卡数据结构
- 多关卡加载
- 关卡选择界面
- 星级评价

### Phase 4: 体验优化
- CodeMirror 代码编辑器
- 步进执行与动画
- 提示系统
- 进度保存

### Phase 5: 内容扩展
- 更多关卡
- 更多 API（感知、物品）
- 教学引导
