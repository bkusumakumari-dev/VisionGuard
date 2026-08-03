class SoundAlarmManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private alarmInterval: number | null = null;
  private activeTimeouts: number[] = [];
  private activeOscillators: OscillatorNode[] = [];

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playBeep(freq = 880, durationMs = 150, type: OscillatorType = 'sine') {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      const stopTime = this.ctx.currentTime + durationMs / 1000;
      osc.stop(stopTime);

      this.activeOscillators.push(osc);
      osc.onended = () => {
        this.activeOscillators = this.activeOscillators.filter(o => o !== osc);
      };
    } catch {
      // Audio autoplay might be blocked until user interacts
    }
  }

  public playEmergencySiren() {
    if (this.isMuted) return;
    this.playBeep(980, 200, 'sawtooth');
    const timerId = window.setTimeout(() => {
      this.playBeep(650, 200, 'sawtooth');
      this.activeTimeouts = this.activeTimeouts.filter(id => id !== timerId);
    }, 220);
    this.activeTimeouts.push(timerId);
  }

  public startContinuousAlarm() {
    if (this.alarmInterval !== null) return;
    this.playEmergencySiren();
    this.alarmInterval = window.setInterval(() => {
      this.playEmergencySiren();
    }, 450);
  }

  public stopContinuousAlarm() {
    // 1. Clear interval timer
    if (this.alarmInterval !== null) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }

    // 2. Clear all queued playBeep timeouts
    this.activeTimeouts.forEach(id => clearTimeout(id));
    this.activeTimeouts = [];

    // 3. Immediately stop all playing audio oscillators
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Already stopped or disconnected
      }
    });
    this.activeOscillators = [];
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopContinuousAlarm();
    }
  }
}

export const soundAlarm = new SoundAlarmManager();
