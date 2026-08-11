import { SoundEffectType } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSoundEffect(type: SoundEffectType, volume = 0.5) {
  if (type === 'none') return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    switch (type) {
      case 'whoosh': {
        // Noise + Frequency Filter Sweep
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(3000, now + 0.2);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);
        filter.Q.value = 3;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(1, now + 0.2);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        noise.start(now);
        noise.stop(now + 0.4);
        break;
      }

      case 'bassDrop': {
        // Sub bass drop 160Hz -> 35Hz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.8);

        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.85);
        break;
      }

      case 'glitch': {
        // Cyber glitch stutter
        for (let i = 0; i < 5; i++) {
          const startTime = now + i * 0.04;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = i % 2 === 0 ? 'square' : 'sawtooth';
          osc.frequency.setValueAtTime(400 + Math.random() * 1200, startTime);

          gain.gain.setValueAtTime(0.6, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.03);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + 0.03);
        }
        break;
      }

      case 'laser': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'stinger': {
        // Heavy metallic impact
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(120, now);
        osc1.frequency.exponentialRampToValueAtTime(40, now + 0.5);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(600, now);
        osc2.frequency.exponentialRampToValueAtTime(80, now + 0.3);

        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
        break;
      }

      case 'pop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case 'beep': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case 'riser': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 1.2);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.8, now + 1.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.25);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 1.25);
        break;
      }
    }
  } catch (err) {
    console.warn('Audio synthesis failed:', err);
  }
}

// Synthetic Background Audio Generator
export function playSyntheticBackgroundBeat(
  type: 'cyber' | 'energetic' | 'chill' | 'cinematic' = 'cyber',
  duration = 5
) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const bpm = type === 'cyber' ? 128 : type === 'energetic' ? 140 : type === 'chill' ? 90 : 100;
    const beatInterval = 60 / bpm;

    for (let t = 0; t < duration; t += beatInterval) {
      const beatTime = now + t;
      const beatNum = Math.floor(t / beatInterval);

      // Kick drum on 1 and 3
      if (beatNum % 2 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, beatTime);
        osc.frequency.exponentialRampToValueAtTime(35, beatTime + 0.12);
        gain.gain.setValueAtTime(0.7, beatTime);
        gain.gain.exponentialRampToValueAtTime(0.01, beatTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(beatTime);
        osc.stop(beatTime + 0.15);
      }

      // Hi-hats on off-beats
      if (beatNum % 1 === 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(4000 + Math.random() * 2000, beatTime);
        gain.gain.setValueAtTime(0.15, beatTime);
        gain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(beatTime);
        osc.stop(beatTime + 0.04);
      }
    }
  } catch (e) {
    console.warn('Synthetic beat playing failed:', e);
  }
}
