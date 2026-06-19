import { useState, useEffect } from 'react'
import { audioManager } from '../audio/AudioManager'

function AudioSettings() {
  const [muted, setMuted] = useState(audioManager.isMuted)
  const [volume, setVolume] = useState(audioManager.masterVolume)
  const [bgmEnabled, setBgmEnabled] = useState(audioManager.isBgmEnabled)
  const [bgmVolume, setBgmVolume] = useState(audioManager.bgmVolumeLevel)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => { audioManager.setMuted(muted) }, [muted])
  useEffect(() => { audioManager.setVolume(volume) }, [volume])
  useEffect(() => { audioManager.setBgmEnabled(bgmEnabled) }, [bgmEnabled])
  useEffect(() => { audioManager.setBgmVolume(bgmVolume) }, [bgmVolume])

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '6px',
    }}>
      {/* 主控制栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(10, 10, 30, 0.85)',
        border: '1px solid #1a1a4e',
        borderRadius: '10px',
        padding: '6px 12px',
        backdropFilter: 'blur(8px)',
      }}>
        {/* 静音按钮 */}
        <button
          onClick={() => setMuted(!muted)}
          title={muted ? '开启音效' : '关闭音效'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            color: muted ? '#556677' : '#00d4ff',
            fontSize: '18px',
            lineHeight: 1,
            transition: 'color 0.2s',
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        {/* 音效音量 */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={e => {
            const v = parseFloat(e.target.value)
            setVolume(v)
            if (v > 0 && muted) setMuted(false)
          }}
          style={{ width: '70px', accentColor: '#00d4ff', cursor: muted ? 'not-allowed' : 'pointer', opacity: muted ? 0.4 : 1 }}
        />

        {/* 展开/收起按钮 */}
        <button
          onClick={() => setExpanded(!expanded)}
          title="背景音乐设置"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            color: expanded ? '#00d4ff' : '#556677',
            fontSize: '14px',
            lineHeight: 1,
            transition: 'color 0.2s, transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </button>
      </div>

      {/* BGM 控制面板 */}
      {expanded && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(10, 10, 30, 0.85)',
          border: '1px solid #1a1a4e',
          borderRadius: '10px',
          padding: '6px 12px',
          backdropFilter: 'blur(8px)',
        }}>
          {/* BGM 开关 */}
          <button
            onClick={() => setBgmEnabled(!bgmEnabled)}
            title={bgmEnabled ? '关闭背景音乐' : '开启背景音乐'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              color: bgmEnabled ? '#00d4ff' : '#556677',
              fontSize: '18px',
              lineHeight: 1,
              transition: 'color 0.2s',
            }}
          >
            {bgmEnabled ? '🎵' : '🎵'}
          </button>

          {/* BGM 音量 */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={bgmEnabled ? bgmVolume : 0}
            onChange={e => {
              const v = parseFloat(e.target.value)
              setBgmVolume(v)
              if (v > 0 && !bgmEnabled) setBgmEnabled(true)
            }}
            style={{ width: '70px', accentColor: '#00d4ff', cursor: bgmEnabled ? 'pointer' : 'not-allowed', opacity: bgmEnabled ? 1 : 0.4 }}
          />
        </div>
      )}
    </div>
  )
}

export default AudioSettings
