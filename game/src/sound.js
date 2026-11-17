// Tidekeeper — synthesized sound effects.
// Every effect is built with WebAudio oscillators and noise, so the game
// ships no audio files and makes no network request. Silent when the Audio
// context is unavailable or the player muted (M).

export function createSound() {
  const sound = { ctx: null, muted: false, master: null };
  try {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (AC) {
      sound.ctx = new AC();
      sound.master = sound.ctx.createGain();
      sound.master.gain.value = 0.32;
      sound.master.connect(sound.ctx.destination);
    }
  } catch {
    sound.ctx = null;
  }
  return sound;
}

function tone(sound, freq, dur, type, vol, slideTo) {
  if (!sound.ctx || sound.muted) return;
  try {
    if (sound.ctx.state === 'suspended') void sound.ctx.resume();
    const t0 = sound.ctx.currentTime;
    const osc = sound.ctx.createOscillator();
    const gain = sound.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(sound.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {
    /* audio is best-effort */
  }
}

function noiseBurst(sound, dur, vol, lowpass) {
  if (!sound.ctx || sound.muted) return;
  try {
    if (sound.ctx.state === 'suspended') void sound.ctx.resume();
    const t0 = sound.ctx.currentTime;
    const len = Math.floor(sound.ctx.sampleRate * dur);
    const buffer = sound.ctx.createBuffer(1, len, sound.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = sound.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = sound.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = sound.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(sound.master);
    src.start(t0);
  } catch {
    /* audio is best-effort */
  }
}

export function playZap(sound) {
  tone(sound, 880, 0.08, 'sawtooth', 0.12, 220);
}

export function playPop(sound) {
  tone(sound, 320, 0.12, 'triangle', 0.2, 90);
  noiseBurst(sound, 0.08, 0.1, 2400);
}

export function playCoin(sound) {
  tone(sound, 1320, 0.09, 'sine', 0.14, 1760);
}

export function playHorn(sound) {
  tone(sound, 196, 0.5, 'sawtooth', 0.16, 147);
  tone(sound, 294, 0.5, 'sawtooth', 0.1, 220);
}

export function playRoar(sound) {
  tone(sound, 90, 0.7, 'sawtooth', 0.24, 45);
  noiseBurst(sound, 0.5, 0.14, 700);
}

export function playSplash(sound) {
  noiseBurst(sound, 0.25, 0.1, 1200);
}

export function playClick(sound) {
  tone(sound, 660, 0.05, 'square', 0.08, 660);
}

export function playBuild(sound) {
  tone(sound, 440, 0.1, 'triangle', 0.14, 660);
  tone(sound, 660, 0.12, 'triangle', 0.1, 880);
}

export function playHurt(sound) {
  tone(sound, 160, 0.25, 'sawtooth', 0.18, 70);
}

export function toggleMute(sound) {
  sound.muted = !sound.muted;
  return sound.muted;
}
