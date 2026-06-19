export type UISoundType = 'ui-click' | 'ui-confirm' | 'ui-back' | 'ui-stop'

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext
}

const SOUND_SETTINGS: Record<UISoundType, { frequency: number; duration: number; volume: number; endFrequency?: number }> = {
  'ui-click': { frequency: 620, duration: 0.055, volume: 0.16, endFrequency: 760 },
  'ui-confirm': { frequency: 740, duration: 0.075, volume: 0.18, endFrequency: 980 },
  'ui-back': { frequency: 520, duration: 0.06, volume: 0.13, endFrequency: 410 },
  'ui-stop': { frequency: 260, duration: 0.085, volume: 0.18, endFrequency: 180 },
}

class AudioManager {
  private context: AudioContext | null = null

  play(type: UISoundType = 'ui-click') {
    const context = this.getContext()

    if (!context) {
      return
    }

    const setting = SOUND_SETTINGS[type]
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    const endTime = now + setting.duration

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(setting.frequency, now)

    if (setting.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(setting.endFrequency, endTime)
    }

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(setting.volume, now + 0.008)
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
