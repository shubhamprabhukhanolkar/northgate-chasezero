/**
 * Subtle Web Audio API telemetry synthesizer for ChaseZero micro-interactions.
 * Safely no-ops if muted or if browser AudioContext is unavailable.
 */

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  freq: number,
  durationMs: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.04,
  delayMs = 0
): void {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime + delayMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  } catch {
    // Never break UI interactions if audio hardware is unavailable
  }
}

export const telemetryAudio = {
  playNodePing(enabled: boolean): void {
    if (!enabled) return;
    playTone(660, 110, 'sine', 0.035);
    playTone(880, 140, 'sine', 0.03, 70);
  },

  playDraftTick(enabled: boolean): void {
    if (!enabled) return;
    playTone(520, 35, 'triangle', 0.015);
  },

  playCriticReject(enabled: boolean): void {
    if (!enabled) return;
    playTone(330, 140, 'triangle', 0.045, 0);
    playTone(240, 220, 'triangle', 0.045, 110);
  },

  playCriticPass(enabled: boolean): void {
    if (!enabled) return;
    playTone(587.33, 120, 'sine', 0.04, 0);
    playTone(783.99, 140, 'sine', 0.04, 90);
    playTone(1046.5, 220, 'sine', 0.035, 180);
  },

  playDispatchSuccess(enabled: boolean): void {
    if (!enabled) return;
    playTone(523.25, 120, 'sine', 0.045, 0);
    playTone(659.25, 120, 'sine', 0.045, 80);
    playTone(783.99, 140, 'sine', 0.045, 160);
    playTone(1046.5, 300, 'sine', 0.05, 240);
  },
};
