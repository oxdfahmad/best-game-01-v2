// Tidekeeper — generative ambient music.
// A slow pentatonic pluck loop over a low tide swell. The tempo follows the
// tide: it quickens a little at high tide and settles at low tide. The
// music starts on the first user gesture, as browsers require.

const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
const BASS = [110, 98, 87.31, 110, 130.81, 98];

export function createMusic(sound) {
  return {
    sound,
    step: 0,
    nextAt: 0,
    started: false,
    bar: 0,
  };
}

export function startMusic(music) {
  if (music.started || !music.sound.ctx) return;
  music.started = true;
  music.nextAt = music.sound.ctx.currentTime + 0.1;
}

function pluck(music, freq, dur, vol) {
  const sound = music.sound;
  if (!sound.ctx || sound.muted) return;
  try {
    if (sound.ctx.state === 'suspended') void sound.ctx.resume();
    const t0 = sound.ctx.currentTime;
    const osc = sound.ctx.createOscillator();
    const gain = sound.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(sound.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {
    /* music is best-effort */
  }
}

export function updateMusic(music, dt, tideLevel, screen) {
  if (!music.started || !music.sound.ctx || music.sound.muted) return;
  const now = music.sound.ctx.currentTime;
  if (now < music.nextAt) return;
  const beatSeconds = screen === 'play' ? 0.42 - tideLevel * 0.1 : 0.62;
  music.nextAt = now + beatSeconds;
  music.step += 1;
  const bar = Math.floor(music.step / 8) % BASS.length;
  if (music.step % 8 === 0) {
    pluck(music, BASS[bar], 1.6, 0.1);
  }
  if (music.step % 2 === 0) {
    const note = SCALE[(music.step * 3 + bar) % SCALE.length];
    pluck(music, note * 2, 0.9, 0.05);
  }
  if (music.step % 16 === 14) {
    pluck(music, SCALE[6] * 2, 1.4, 0.06);
  }
}
