import { useState } from 'react'
import MenuBackground from './MenuBackground'

function MainMenu({ onStart }: { onStart: () => void }) {
  const [showAbout, setShowAbout] = useState(false)

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#050510',
      color: '#e0e0e0',
      overflow: 'hidden',
    }}>
      <MenuBackground />

      {/* 标题区域 */}
      <div style={{ zIndex: 1, textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{
          fontSize: '80px',
          margin: '0 0 12px 0',
          color: '#00d4ff',
          textShadow: '0 0 40px rgba(0, 212, 255, 0.5), 0 0 80px rgba(0, 212, 255, 0.2)',
          letterSpacing: '8px',
          fontWeight: 900,
        }}>
          LOGICPLAY
        </h1>
        <div style={{
          width: '120px',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
          margin: '0 auto 16px auto',
        }} />
        <p style={{
          fontSize: '22px',
          color: '#6688aa',
          letterSpacing: '6px',
          margin: 0,
        }}>
          边玩边学算法
        </p>
      </div>

      {/* 按钮区域 */}
      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <button
          onClick={onStart}
          style={{
            padding: '16px 64px',
            fontSize: '22px',
            background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 'bold',
            letterSpacing: '4px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 212, 255, 0.5)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 212, 255, 0.3)'
          }}
        >
          开始游戏
        </button>
        <button
          onClick={() => setShowAbout(true)}
          style={{
            padding: '10px 32px',
            fontSize: '16px',
            background: 'transparent',
            color: '#6688aa',
            border: '1px solid #334455',
            borderRadius: '8px',
            cursor: 'pointer',
            letterSpacing: '2px',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#00d4ff'
            e.currentTarget.style.color = '#00d4ff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#334455'
            e.currentTarget.style.color = '#6688aa'
          }}
        >
          关于
        </button>
      </div>

      {/* 底部提示 */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        color: '#334455',
        fontSize: '14px',
        letterSpacing: '2px',
        zIndex: 1,
      }}>
        用代码控制机器人，通关算法挑战
      </div>

      {/* 关于弹窗 */}
      {showAbout && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          onClick={() => setShowAbout(false)}
        >
          <div
            style={{
              background: '#0f0f2e',
              border: '1px solid #1a1a4e',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '520px',
              width: '90%',
              boxShadow: '0 0 40px rgba(0, 212, 255, 0.1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{
              color: '#00d4ff',
              fontSize: '28px',
              margin: '0 0 20px 0',
              letterSpacing: '2px',
            }}>
              关于 LogicPlay
            </h2>
            <p style={{ color: '#aabbcc', lineHeight: '1.8', margin: '0 0 16px 0' }}>
              LogicPlay 是一款通过编写代码控制机器人通关的算法学习游戏。
            </p>
            <h3 style={{ color: '#00d4ff', fontSize: '18px', margin: '20px 0 10px 0' }}>玩法</h3>
            <ul style={{ color: '#8899aa', lineHeight: '2', paddingLeft: '20px', margin: 0 }}>
              <li>使用 Python 代码控制机器人移动</li>
              <li><code style={{ color: '#00d4ff' }}>robot.move_forward()</code> 向前走一步</li>
              <li><code style={{ color: '#00d4ff' }}>robot.turn_left()</code> 左转 90 度</li>
              <li><code style={{ color: '#00d4ff' }}>robot.turn_right()</code> 右转 90 度</li>
              <li>避开障碍物，到达终点即可通关</li>
            </ul>
            <button
              onClick={() => setShowAbout(false)}
              style={{
                marginTop: '28px',
                padding: '10px 40px',
                fontSize: '16px',
                background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MainMenu
