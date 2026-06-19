export type UISoundType = 'ui-click' | 'ui-confirm' | 'ui-back' | 'ui-stop'
export type GameSoundType = 'robot-step' | 'robot-turn' | 'collision' | 'collect' | 'success' | 'test-pass' | 'test-fail'
export type SoundType = UISoundType | GameSoundType

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext
}

const STORAGE_KEY = 'logicplay-audio-settings'

const DEFAULT_SETTINGS = {
  muted: false,
  volume: 0.5,
}

const SOUND_SETTINGS: Record<SoundType, { frequency: number; duration: number; volume: number; endFrequency?: number; type?: OscillatorType }> = {
  // UI 音效
  'ui-click': { frequency: 620, duration: 0.055, volume: 0.16, endFrequency: 760 },
  'ui-confirm': { frequency: 740, duration: 0.075, volume: 0.18, endFrequency: 980 },
  'ui-back': { frequency: 520, duration: 0.06, volume: 0.13, endFrequency: 410 },
  'ui-stop': { frequency: 260, duration: 0.085, volume: 0.18, endFrequency: 180 },
  // 游戏事件音效
  'robot-step': { frequency: 440, duration: 0.04, volume: 0.1, endFrequency: 520 },
  'robot-turn': { frequency: 350, duration: 0.035, volume: 0.08, endFrequency: 300 },
  'collision': { frequency: 150, duration: 0.2, volume: 0.25, type: 'sawtooth' },
  'collect': { frequency: 880, duration: 0.1, volume: 0.15, endFrequency: 1320 },
  'success': { frequency: 523, duration: 0.35, volume: 0.2 },
  'test-pass': { frequency: 660, duration: 0.12, volume: 0.15, endFrequency: 880 },
  'test-fail': { frequency: 200, duration: 0.18, volume: 0.2, type: 'square' },
}

function loadSettings(): { muted: boolean; volume: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        muted: typeof parsed.muted === 'boolean' ? parsed.muted : DEFAULT_SETTINGS.muted,
        volume: typeof parsed.volume === 'number' ? parsed.volume : DEFAULT_SETTINGS.volume,
      }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

function saveSettings(settings: { muted: boolean; volume: number }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch { /* ignore */ }
}

class AudioManager {
  private context: AudioContext | null = null
  private muted: boolean
  private volume: number

  constructor() {
    const settings = loadSettings()
    this.muted = settings.muted
    this.volume = settings.volume
  }

  get isMuted() {
    return this.muted
  }

  get masterVolume() {
    return this.volume
  }

  setMuted(value: boolean) {
    this.muted = value
    saveSettings({ muted: this.muted, volume: this.volume })
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value))
    saveSettings({ muted: this.muted, volume: this.volume })
  }

  play(type: SoundType = 'ui-click') {
    if (this.muted || this.volume === 0) return

    const context = this.getContext()
    if (!context) return

    const setting = SOUND_SETTINGS[type]
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    const endTime = now + setting.duration

    const effectiveVolume = setting.volume * this.volume

    oscillator.type = setting.type ?? 'sine'
    oscillator.frequency.setValueAtTime(setting.frequency, now)

    if (setting.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(setting.endFrequency, endTime)
    }

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(effectiveVolume, now + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(endTime + 0.01)

    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
    }
  }

  private getContext() {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const audioWindow = window as AudioWindow
      const AudioContextClass = audioWindow.AudioContext || audioWindow.webkitAudioContext

      if (!AudioContextClass) {
        return null
      }

      if (!this.context) {
        this.context = new AudioContextClass()
      }

      if (this.context.state === 'suspended') {
        void this.context.resume()
      }

      return this.context
    } catch {
      return null
    }
  }
}

export const audioManager = new AudioManager()
