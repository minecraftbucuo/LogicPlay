import { useState } from 'react'
import MenuBackground from './MenuBackground'
import { audioManager } from '../audio/AudioManager'

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
      <div style={{ zIndex: 1, textAlign: 'center', marginBottom: '120px' }}>
        <h1 style={{
          fontSize: '96px',
          margin: '0 0 16px 0',
          color: '#00d4ff',
          textShadow: '0 0 60px rgba(0, 212, 255, 0.6), 0 0 120px rgba(0, 212, 255, 0.15)',
          letterSpacing: '12px',
          fontWeight: 900,
          lineHeight: 1,
        }}>
          LOGICPLAY
        </h1>
        <div style={{
          width: '200px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
          margin: '0 auto 24px auto',
          opacity: 0.6,
        }} />
        <p style={{
          fontSize: '20px',
          color: '#5577aa',
          letterSpacing: '8px',
          margin: 0,
          fontWeight: 300,
        }}>
          用 PYTHON 控制机器人
        </p>
      </div>

      {/* 按钮区域 */}
      <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
        <button
          onClick={() => {
            audioManager.play('ui-confirm')
            onStart()
          }}
          style={{
            padding: '18px 80px',
            fontSize: '20px',
            background: 'linear-gradient(135deg, #00d4ff, #0088bb)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 700,
            letterSpacing: '6px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 30px rgba(0, 212, 255, 0.25)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 40px rgba(0, 212, 255, 0.45)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 212, 255, 0.25)'
          }}
        >
          开始游戏
        </button>
        <button
          onClick={() => {
            audioManager.play('ui-click')
            setShowAbout(true)
          }}
          style={{
            padding: '10px 36px',
            fontSize: '14px',
            background: 'transparent',
            color: '#556677',
            border: '1px solid #223344',
            borderRadius: '6px',
            cursor: 'pointer',
            letterSpacing: '3px',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#00d4ff'
            e.currentTarget.style.color = '#00d4ff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#223344'
            e.currentTarget.style.color = '#556677'
          }}
        >
          关于
        </button>
      </div>

      {/* 底部提示 */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        color: '#2a3344',
        fontSize: '13px',
        letterSpacing: '3px',
        zIndex: 1,
        fontWeight: 300,
      }}>
        用代码控制机器人，挑战编程关卡
      </div>

      {/* 关于弹窗 */}
      {showAbout && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          onClick={() => {
            audioManager.play('ui-back')
            setShowAbout(false)
          }}
        >
          <div
            style={{
              background: '#0a0a24',
              border: '1px solid #1a1a4e',
              borderRadius: '16px',
              padding: '48px',
              maxWidth: '520px',
              width: '90%',
              boxShadow: '0 0 60px rgba(0, 212, 255, 0.08)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{
              color: '#00d4ff',
              fontSize: '24px',
              margin: '0 0 24px 0',
              letterSpacing: '3px',
              fontWeight: 700,
            }}>
              关于 LOGICPLAY
            </h2>
            <p style={{ color: '#8899aa', lineHeight: '2', margin: 0, fontSize: '15px' }}>
              LogicPlay 是一款用 Python 控制机器人闯关的编程练习游戏。你会从最基础的移动开始，在一个个任务中逐步掌握循环、条件判断、函数封装和简单策略。
            </p>
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  audioManager.play('ui-back')
                  setShowAbout(false)
                }}
                style={{
                  padding: '12px 48px',
                  fontSize: '15px',
                  background: 'linear-gradient(135deg, #00d4ff, #0088bb)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  letterSpacing: '2px',
                }}
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MainMenu
