import { useState, useEffect } from 'react'
import { audioManager } from '../audio/AudioManager'

function AudioSettings() {
  const [muted, setMuted] = useState(audioManager.isMuted)
  const [volume, setVolume] = useState(audioManager.masterVolume)

  useEffect(() => {
    audioManager.setMuted(muted)
  }, [muted])

  useEffect(() => {
    audioManager.setVolume(volume)
  }, [volume])

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      right: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: 100,
      background: 'rgba(10, 10, 30, 0.85)',
      border: '1px solid #1a1a4e',
      borderRadius: '10px',
      padding: '8px 14px',
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
          fontSize: '20px',
          lineHeight: 1,
          transition: 'color 0.2s',
        }}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {/* 音量滑块 */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={muted ? 0 : volume}
        onChange={e => {
          const v = parseFloat(e.target.value)
          setVolume(v)
          if (v > 0 && muted) {
            setMuted(false)
          }
        }}
        style={{
          width: '80px',
          accentColor: '#00d4ff',
          cursor: muted ? 'not-allowed' : 'pointer',
          opacity: muted ? 0.4 : 1,
        }}
      />
    </div>
  )
}

export default AudioSettings
