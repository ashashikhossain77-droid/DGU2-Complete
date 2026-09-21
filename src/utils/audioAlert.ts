/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Web Audio API Acoustic Alert Synthesizer for Factory Floor Line Monitoring.
 * Generates clear, non-jarring industrial chimes without external audio asset dependencies.
 */

let sharedAudioCtx: AudioContext | null = null;
let lastAlertPlayedTimestamp = 0;
const MIN_ALERT_INTERVAL_MS = 1500; // Prevent audio clipping/spamming on batch data updates

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err);
    return null;
  }
}

/**
 * Play a high WIP buffer breach auditory alert:
 * Dual-tone harmonic chime (D5 -> A5) with smooth exponential decay.
 */
export function playWipAlertSound(force: boolean = false): boolean {
  const now = Date.now();
  if (!force && now - lastAlertPlayedTimestamp < MIN_ALERT_INTERVAL_MS) {
    return false;
  }
  lastAlertPlayedTimestamp = now;

  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    const startTime = ctx.currentTime + 0.02;

    // First Tone: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, startTime);
    osc1.frequency.exponentialRampToValueAtTime(620, startTime + 0.12);

    gain1.gain.setValueAtTime(0.001, startTime);
    gain1.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(startTime);
    osc1.stop(startTime + 0.2);

    // Second Tone: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, startTime + 0.12);

    gain2.gain.setValueAtTime(0.001, startTime + 0.12);
    gain2.gain.linearRampToValueAtTime(0.35, startTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(startTime + 0.12);
    osc2.stop(startTime + 0.65);

    return true;
  } catch (e) {
    console.warn('Failed to play WIP audio alert:', e);
    return false;
  }
}

/**
 * Play a bottleneck critical station alert:
 * Tri-tone ascending alert sequence (E5 -> G#5 -> B5) with distinct alert harmonics.
 */
export function playBottleneckAlertSound(force: boolean = false): boolean {
  const now = Date.now();
  if (!force && now - lastAlertPlayedTimestamp < MIN_ALERT_INTERVAL_MS) {
    return false;
  }
  lastAlertPlayedTimestamp = now;

  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    const startTime = ctx.currentTime + 0.02;
    const notes = [
      { freq: 659.25, start: 0.0, dur: 0.12, vol: 0.2 },
      { freq: 830.61, start: 0.1, dur: 0.12, vol: 0.25 },
      { freq: 987.77, start: 0.2, dur: 0.45, vol: 0.35 }
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, startTime + note.start);

      gain.gain.setValueAtTime(0.001, startTime + note.start);
      gain.gain.linearRampToValueAtTime(note.vol, startTime + note.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.start + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime + note.start);
      osc.stop(startTime + note.start + note.dur + 0.05);
    });

    return true;
  } catch (e) {
    console.warn('Failed to play Bottleneck audio alert:', e);
    return false;
  }
}

/**
 * General acoustic alert dispatcher for high WIP and bottleneck line monitoring.
 */
export function playAuditoryAlert(type: 'wip' | 'bottleneck' | 'general' = 'general', force: boolean = false): boolean {
  if (type === 'bottleneck') {
    return playBottleneckAlertSound(force);
  }
  return playWipAlertSound(force);
}
