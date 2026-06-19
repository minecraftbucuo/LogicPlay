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
  bgmEnabled: true,
  bgmVolume: 0.15,
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

type AudioSettings = { muted: boolean; volume: number; bgmEnabled: boolean; bgmVolume: number }

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        muted: typeof parsed.muted === 'boolean' ? parsed.muted : DEFAULT_SETTINGS.muted,
        volume: typeof parsed.volume === 'number' ? parsed.volume : DEFAULT_SETTINGS.volume,
        bgmEnabled: typeof parsed.bgmEnabled === 'boolean' ? parsed.bgmEnabled : DEFAULT_SETTINGS.bgmEnabled,
        bgmVolume: typeof parsed.bgmVolume === 'number' ? parsed.bgmVolume : DEFAULT_SETTINGS.bgmVolume,
      }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

function saveSettings(settings: AudioSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch { /* ignore */ }
}

class AudioManager {
  private context: AudioContext | null = null
  private muted: boolean
  private volume: number
  private bgmEnabled: boolean
  private bgmVolume: number
  private bgmAudio: HTMLAudioElement | null = null
  private bgmStarted = false

  constructor() {
    const settings = loadSettings()
    this.muted = settings.muted
    this.volume = settings.volume
    this.bgmEnabled = settings.bgmEnabled
    this.bgmVolume = settings.bgmVolume
  }

  get isMuted() { return this.muted }
  get masterVolume() { return this.volume }
  get isBgmEnabled() { return this.bgmEnabled }
  get bgmVolumeLevel() { return this.bgmVolume }

  setMuted(value: boolean) {
    this.muted = value
    saveSettings({ muted: this.muted, volume: this.volume, bgmEnabled: this.bgmEnabled, bgmVolume: this.bgmVolume })
    if (this.muted) {
      this.stopBgm()
    } else if (this.bgmEnabled) {
      this.startBgm()
    }
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value))
    saveSettings({ muted: this.muted, volume: this.volume, bgmEnabled: this.bgmEnabled, bgmVolume: this.bgmVolume })
  }

  setBgmEnabled(value: boolean) {
    this.bgmEnabled = value
    saveSettings({ muted: this.muted, volume: this.volume, bgmEnabled: this.bgmEnabled, bgmVolume: this.bgmVolume })
    if (!this.bgmEnabled) {
      this.stopBgm()
    } else {
      this.startBgm()
    }
  }

  setBgmVolume(value: number) {
    this.bgmVolume = Math.max(0, Math.min(1, value))
    saveSettings({ muted: this.muted, volume: this.volume, bgmEnabled: this.bgmEnabled, bgmVolume: this.bgmVolume })
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.bgmVolume
    }
  }

  startBgm() {
    if (!this.bgmEnabled || this.muted) return
    if (this.bgmStarted) return

    this.bgmStarted = true

    const audio = new Audio('/audio/bgm.mp3')
    audio.loop = true
    audio.volume = this.bgmVolume

    audio.play().then(() => {
      console.log('[Audio] BGM started')
    }).catch((e) => {
      console.warn('[Audio] BGM play failed:', e)
      this.bgmStarted = false
    })

    this.bgmAudio = audio
  }

  // 注册全局点击监听，用户第一次点击页面时启动 BGM
  initBgmOnUserInteraction() {
    // BGM 在 play() 中自动启动，无需单独监听
  }

  stopBgm() {
    if (!this.bgmAudio) return
    this.bgmAudio.pause()
    this.bgmAudio.src = ''
    this.bgmAudio = null
    this.bgmStarted = false
  }

  play(type: SoundType = 'ui-click') {
    // 首次用户交互时启动 BGM（必须在用户手势上下文中调用 audio.play()）
    if (!this.bgmStarted && this.bgmEnabled && !this.muted) {
      this.startBgm()
    }

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
