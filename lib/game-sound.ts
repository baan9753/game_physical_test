// Owner-supplied game audio, adapted to a self-contained browser engine.
export type GameSoundEffect =
  | 'count'
  | 'start'
  | 'warning'
  | 'charge'
  | 'flash'
  | 'dodge'
  | 'impact'
  | 'swat'
  | 'mosquito'
  | 'miss'
  | 'correct'
  | 'wrong'
  | 'timer'
  | 'timerTick'
  | 'timeStop'
  | 'type'
  | 'perfect'
  | 'great'
  | 'cool'
  | 'good'
  | 'bad'
  | 'nearMiss'
  | 'rocketKey'
  | 'launch'
  | 'complete';
export function createGameSound() {
  let audio: AudioContext | null = null,
    musicGain: GainNode | null = null,
    sfxGain: GainNode | null = null;
  let musicEnabled = true,
    sfxEnabled = true,
    paused = false,
    disposed = false,
    playing = false,
    step = 0,
    nextNote = 0;
  let stopMusic = () => {};
  function tone(
    freq: number,
    duration = 0.12,
    wave: OscillatorType = 'square',
    volume = 0.2,
    slide = 0,
    bus: GainNode | null = sfxGain,
    at?: number,
  ) {
    if (!audio || !bus || (bus === musicGain ? !musicEnabled : !sfxEnabled) || disposed) return;
    const t = at ?? audio.currentTime,
      o = audio.createOscillator(),
      g = audio.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(35, freq + slide), t + duration);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g);
    g.connect(bus);
    o.start(t);
    o.stop(t + duration + 0.015);
  }
  function noise(
    duration: number,
    volume: number,
    filterType: BiquadFilterType = 'lowpass',
    cutoff = 1000,
    bus: GainNode | null = sfxGain,
    at?: number,
  ) {
    if (!audio || !bus || (bus === musicGain ? !musicEnabled : !sfxEnabled) || disposed) return;
    const t = at ?? audio.currentTime,
      length = Math.max(1, Math.floor(audio.sampleRate * duration)),
      buffer = audio.createBuffer(1, length, audio.sampleRate),
      data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[Number(i)] = Math.random() * 2 - 1;
    const src = audio.createBufferSource(),
      filter = audio.createBiquadFilter(),
      gain = audio.createGain();
    src.buffer = buffer;
    filter.type = filterType;
    filter.frequency.setValueAtTime(cutoff, t);
    gain.gain.setValueAtTime(Math.max(0.0001, volume), t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    src.start(t);
    src.stop(t + duration);
  }
  function rocketBooster(at: number) {
    if (!audio || !sfxGain || !sfxEnabled || disposed) return;
    const duration = 0.72,
      length = Math.max(1, Math.floor(audio.sampleRate * duration)),
      buffer = audio.createBuffer(1, length, audio.sampleRate),
      data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const source = audio.createBufferSource(),
      filter = audio.createBiquadFilter(),
      gain = audio.createGain(),
      rumble = audio.createOscillator(),
      rumbleGain = audio.createGain();
    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, at);
    filter.frequency.exponentialRampToValueAtTime(1450, at + duration);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.4, at + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.08, at + duration);
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(48, at);
    rumble.frequency.exponentialRampToValueAtTime(130, at + duration);
    rumbleGain.gain.setValueAtTime(0.0001, at);
    rumbleGain.gain.exponentialRampToValueAtTime(0.16, at + 0.04);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    rumble.connect(rumbleGain);
    rumbleGain.connect(sfxGain);
    source.start(at);
    source.stop(at + duration);
    rumble.start(at);
    rumble.stop(at + duration);
  }
  function musicDrum(kind: 'kick' | 'snare' | 'hat', at: number) {
    if (kind === 'kick') tone(120, 0.13, 'sine', 0.42, -82, musicGain, at);
    else if (kind === 'snare') noise(0.11, 0.17, 'highpass', 1700, musicGain, at);
    else noise(0.035, 0.055, 'highpass', 5200, musicGain, at);
  }
  function startMusic() {
    if (!audio || playing || disposed) return;
    step = 0;
    nextNote = audio.currentTime + 0.08;
    playing = true;
    const bass = [130.81, 0, 130.81, 0, 164.81, 0, 164.81, 0, 196, 0, 196, 0, 174.61, 0, 164.81, 0],
      lead = [
        523.25, 659.25, 784, 659.25, 587.33, 784, 880, 784, 523.25, 659.25, 1046.5, 880, 784,
        659.25, 587.33, 659.25,
      ],
      stepSec = 60 / 150 / 2;
    const timer = setInterval(() => {
      if (!audio || audio.state !== 'running' || !musicEnabled || paused || disposed) return;
      if (nextNote < audio.currentTime - 0.5) nextNote = audio.currentTime + 0.08;
      while (nextNote < audio.currentTime + 0.09) {
        const i = step % 16,
          t = nextNote,
          b = bass.at(i) ?? 0,
          l = lead.at(i) ?? 0;
        if (b) tone(b, 0.17, 'triangle', 0.2, 0, musicGain, t);
        tone(l, 0.105, 'square', i % 4 === 0 ? 0.14 : 0.09, 0, musicGain, t);
        if (i % 4 === 0) tone(l, 0.2, 'triangle', 0.065, 0, musicGain, t);
        if (i % 4 === 0) musicDrum('kick', t);
        else if (i % 4 === 2) musicDrum('snare', t);
        if (i % 2 === 1) musicDrum('hat', t);
        step++;
        nextNote += stepSec;
      }
    }, 25);
    stopMusic = () => clearInterval(timer);
  }
  function ensureAudio() {
    if ((!musicEnabled && !sfxEnabled) || disposed) return;
    try {
      if (!audio) {
        audio = new AudioContext();
        musicGain = audio.createGain();
        sfxGain = audio.createGain();
        musicGain.gain.value = musicEnabled ? 0.25 : 0;
        sfxGain.gain.value = sfxEnabled ? 0.62 : 0;
        musicGain.connect(audio.destination);
        sfxGain.connect(audio.destination);
        if (musicEnabled) startMusic();
      }
      if (audio.state === 'suspended' && !paused) {
        const a = audio;
        void a
          .resume()
          .then(() => {
            if (paused && !disposed) void a.suspend().catch(() => {});
          })
          .catch(() => {});
      }
    } catch {
      /* Audio unavailable must never interrupt gameplay. */
    }
  }
  function playSfx(kind: GameSoundEffect) {
    if (!sfxEnabled || paused || disposed) return;
    ensureAudio();
    if (!audio) return;
    try {
      const a = audio;
      const n = (f: number, d: number, w: OscillatorType, v: number, slide = 0, delay = 0) =>
        tone(f, d, w, v, slide, sfxGain, a.currentTime + delay);
      switch (kind) {
        case 'count':
          n(620, 0.075, 'square', 0.12);
          break;
        case 'start':
          n(523, 0.1, 'square', 0.15);
          n(784, 0.18, 'square', 0.15, 0, 0.11);
          break;
        case 'warning':
          n(92, 0.34, 'sawtooth', 0.24, -28);
          n(184, 0.28, 'square', 0.09, -35, 0.02);
          break;
        case 'charge':
          noise(0.38, 0.72, 'lowpass', 1000);
          n(120, 0.42, 'sawtooth', 0.38, -85);
          n(62, 0.38, 'sine', 0.48, 0, 0.025);
          n(240, 0.16, 'square', 0.18, -190, 0.05);
          break;
        case 'flash':
          n(880, 0.08, 'square', 0.14, 350);
          n(1320, 0.12, 'triangle', 0.1, 0, 0.035);
          break;
        case 'dodge':
          n(660, 0.1, 'triangle', 0.15);
          n(990, 0.22, 'square', 0.1, 0, 0.07);
          break;
        case 'impact':
          noise(0.28, 0.72, 'lowpass', 430);
          n(92, 0.32, 'sine', 0.58, -70);
          n(48, 0.38, 'triangle', 0.34, -18, 0.015);
          break;
        case 'swat':
          noise(0.15, 0.32, 'bandpass', 1450);
          n(390, 0.13, 'sawtooth', 0.16, -260);
          break;
        case 'mosquito':
          noise(0.065, 0.2, 'lowpass', 650);
          n(250, 0.09, 'triangle', 0.15, -120);
          break;
        case 'miss':
          n(210, 0.11, 'square', 0.09, -100);
          break;
        case 'correct':
          n(720, 0.08, 'square', 0.11);
          n(960, 0.11, 'triangle', 0.1, 0, 0.075);
          break;
        case 'wrong':
          n(190, 0.16, 'sawtooth', 0.13, -90);
          break;
        case 'timer':
          n(1046, 0.09, 'square', 0.17);
          n(1568, 0.12, 'triangle', 0.1, 0, 0.06);
          break;
        case 'timerTick':
          n(1318, 0.055, 'square', 0.12);
          break;
        case 'timeStop':
          // 높은 음이 빠르게 가라앉는 짧은 정지감으로 타이머 입력을 구분합니다.
          n(1480, 0.16, 'triangle', 0.14, -920);
          n(740, 0.24, 'sine', 0.12, -360, 0.025);
          noise(0.12, 0.12, 'lowpass', 900);
          break;
        case 'type':
          n(930, 0.035, 'square', 0.065, -120);
          break;
        case 'perfect':
          n(660, 0.14, 'triangle', 0.24);
          n(880, 0.18, 'square', 0.22, 0, 0.09);
          n(1320, 0.28, 'triangle', 0.2, 0, 0.19);
          break;
        case 'great':
          n(880, 0.13, 'triangle', 0.24);
          n(1175, 0.22, 'triangle', 0.2, 0, 0.1);
          break;
        case 'cool':
          n(740, 0.16, 'sine', 0.24);
          n(988, 0.23, 'triangle', 0.2, 0, 0.1);
          break;
        case 'good':
          n(587, 0.14, 'square', 0.22);
          n(740, 0.18, 'triangle', 0.18, 0, 0.1);
          break;
        case 'bad':
          n(390, 0.17, 'triangle', 0.22, -130);
          n(270, 0.12, 'square', 0.15, -50, 0.11);
          break;
        case 'nearMiss':
          n(260, 0.08, 'triangle', 0.07, -150);
          break;
        case 'rocketKey':
          n(560, 0.045, 'square', 0.075, 100);
          break;
        case 'launch':
          noise(0.09, 0.62, 'lowpass', 380, sfxGain, a.currentTime);
          rocketBooster(a.currentTime + 0.035);
          break;
        case 'complete':
          n(523, 0.12, 'triangle', 0.12);
          n(659, 0.12, 'triangle', 0.12, 0, 0.1);
          n(784, 0.22, 'triangle', 0.12, 0, 0.2);
          break;
      }
    } catch {
      /* Invalid audio state must never interrupt gameplay. */
    }
  }
  function setMusicEnabled(value: boolean) {
    if (disposed) return;
    musicEnabled = value;
    try {
      if (value) ensureAudio();
      if (value) startMusic();
      if (musicGain && audio) {
        musicGain.gain.setTargetAtTime(value ? 0.25 : 0, audio.currentTime, value ? 0.06 : 0.025);
      }
    } catch {
      /* Mute failures cannot affect game state. */
    }
  }
  function setSfxEnabled(value: boolean) {
    if (disposed) return;
    sfxEnabled = value;
    try {
      if (value) ensureAudio();
      if (sfxGain && audio) {
        sfxGain.gain.setTargetAtTime(value ? 0.62 : 0, audio.currentTime, value ? 0.06 : 0.025);
      }
    } catch {
      /* Mute failures cannot affect game state. */
    }
  }
  function pauseAudio() {
    paused = true;
    try {
      if (audio && audio.state === 'running') {
        const a = audio;
        void a
          .suspend()
          .then(() => {
            if (!paused && (musicEnabled || sfxEnabled) && !disposed)
              void a.resume().catch(() => {});
          })
          .catch(() => {});
      }
    } catch {}
  }
  function resumeAudio() {
    paused = false;
    if (musicEnabled || sfxEnabled) ensureAudio();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    stopMusic();
    const a = audio;
    audio = null;
    musicGain = null;
    sfxGain = null;
    if (a)
      try {
        void a.close().catch(() => {});
      } catch {}
  }
  return {
    ensureAudio,
    playSfx,
    setMusicEnabled,
    setSfxEnabled,
    pauseAudio,
    resumeAudio,
    dispose,
  };
}
