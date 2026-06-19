import { useMemo } from 'react'
import { LEVELS } from '../game/LevelRegistry'
import { isLevelCompleted, isLevelUnlocked, loadProgress } from '../game/ProgressStore'
import { audioManager } from '../audio/AudioManager'

interface LevelSelectProps {
  onBack: () => void
  onSelectLevel: (levelId: string) => void
}

function LevelSelect({ onBack, onSelectLevel }: LevelSelectProps) {
  const progress = useMemo(() => loadProgress(), [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #101033 0%, #050510 70%)',
      color: '#e0e0e0',
      padding: '48px',
      boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <button
          onClick={() => {
            audioManager.play('ui-back')
            onBack()
          }}
          style={{
            background: 'transparent',
            border: '1px solid #334455',
            color: '#6688aa',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '32px',
          }}
        >
          ← 返回主菜单
        </button>

        <div style={{ marginBottom: '36px' }}>
          <h1 style={{
            margin: '0 0 10px 0',
            color: '#00d4ff',
            fontSize: '42px',
            letterSpacing: '4px',
            textShadow: '0 0 30px rgba(0, 212, 255, 0.25)',
          }}>
            选择关卡
          </h1>
          <p style={{ color: '#8899aa', margin: 0 }}>
            关卡按顺序线性解锁。当前内容为框架占位，正式关卡会后续逐个设计。
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px',
        }}>
          {LEVELS.map((level, index) => {
            const unlocked = isLevelUnlocked(level.id, progress)
            const completed = isLevelCompleted(level.id, progress)

            return (
              <button
                key={level.id}
                onClick={() => {
                  if (!unlocked) return
                  audioManager.play('ui-confirm')
                  onSelectLevel(level.id)
                }}
                disabled={!unlocked}
                style={{
                  textAlign: 'left',
                  padding: '22px',
                  minHeight: '160px',
                  background: unlocked
                    ? 'linear-gradient(145deg, rgba(15, 15, 46, 0.95), rgba(10, 30, 55, 0.9))'
                    : 'rgba(20, 20, 30, 0.6)',
                  border: unlocked ? '1px solid #1a6f8f' : '1px solid #333',
                  borderRadius: '16px',
                  color: unlocked ? '#e0e0e0' : '#555',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  boxShadow: unlocked ? '0 0 24px rgba(0, 212, 255, 0.08)' : 'none',
                  transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                  opacity: unlocked ? 1 : 0.55,
                }}
                onMouseEnter={e => {
                  if (!unlocked) return
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = '#00d4ff'
                  e.currentTarget.style.boxShadow = '0 10px 32px rgba(0, 212, 255, 0.18)'
                }}
                onMouseLeave={e => {
                  if (!unlocked) return
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = '#1a6f8f'
                  e.currentTarget.style.boxShadow = '0 0 24px rgba(0, 212, 255, 0.08)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '18px',
                }}>
                  <span style={{
                    color: unlocked ? '#00d4ff' : '#666',
                    fontSize: '14px',
                    letterSpacing: '2px',
                  }}>
                    LEVEL {String(index + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '18px' }}>
                    {completed ? '✅' : unlocked ? '🔓' : '🔒'}
                  </span>
                </div>

                <h2 style={{
                  margin: '0 0 10px 0',
                  fontSize: '22px',
                  color: unlocked ? '#ffffff' : '#777',
                }}>
                  {level.name}
                </h2>
                <p style={{
                  margin: 0,
                  color: unlocked ? '#8899aa' : '#666',
                  lineHeight: 1.6,
                  fontSize: '14px',
                }}>
                  {unlocked ? level.description ?? '暂无描述' : '完成上一关后解锁'}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LevelSelect
