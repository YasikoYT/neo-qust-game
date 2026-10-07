/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private sequencerInterval: any = null;
  private isMusicPlaying = false;
  private isEnginePlaying = false;
  
  public soundEnabled = true;
  public musicEnabled = true;

  constructor() {
    // Lazy initialize on first interaction
  }

  private initContext() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play a simple retro synth note
  private playNote(freq: number, duration: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine', gainStart = 0.1, gainEnd = 0.001) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(gainStart, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gainEnd, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio failed to play", e);
    }
  }

  // Sound: Collect Energy Orb
  public playCollect() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      // Arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.08, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.2);
      });
    } catch (e) {}
  }

  // Sound: Crash with obstacle
  public playCrash() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      
      // White noise explosion
      const bufferSize = ctx.sampleRate * 0.4; // 0.4 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(20, now + 0.4);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start();
      noise.stop(now + 0.4);

      // Low rumble osc
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(20, now + 0.3);
      oscGain.gain.setValueAtTime(0.2, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  // Sound: Shield Lost warning
  public playShieldLost() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  // Sound: Laser fire or Speed boost
  public playLaser() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // Sound: Level Up / High score unlocked
  public playLevelUp() {
    this.playNote(523.25, 0.1, 'sine', 0.1, 0.05);
    setTimeout(() => this.playNote(659.25, 0.1, 'sine', 0.1, 0.05), 100);
    setTimeout(() => this.playNote(783.99, 0.1, 'sine', 0.1, 0.05), 200);
    setTimeout(() => this.playNote(1046.50, 0.3, 'sine', 0.15, 0.001), 300);
  }

  // Sound: Game Over tune
  public playGameOver() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const freqs = [392.00, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4 (C minor fall)
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0.12, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.45);
      });
    } catch (e) {}
  }

  // Start continuous spaceship engine hum
  public startEngineHum() {
    if (!this.soundEnabled || this.isEnginePlaying) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, now); // Low A hum
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, now);
      
      gain.gain.setValueAtTime(0.15, now);
      
      // LFO for nice rumble effect
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(8, now); // 8 Hz wobble
      lfoGain.gain.setValueAtTime(15, now); // Modulate pitch by 15Hz
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      lfo.start();
      osc.start();
      
      this.engineOsc = osc;
      this.engineGain = gain;
      this.isEnginePlaying = true;
    } catch (e) {}
  }

  // Update engine frequency based on flight speed
  public updateEnginePitch(speedRatio: number) {
    if (!this.engineOsc || !this.ctx) return;
    try {
      const targetFreq = 55 + (speedRatio * 45); // Range from 55Hz to 100Hz
      this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    } catch (e) {}
  }

  // Stop engine hum
  public stopEngineHum() {
    if (!this.isEnginePlaying) return;
    try {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        const osc = this.engineOsc;
        setTimeout(() => {
          try {
            osc?.stop();
          } catch (e) {}
        }, 220);
      }
    } catch (e) {}
    this.engineOsc = null;
    this.engineGain = null;
    this.isEnginePlaying = false;
  }

  // Synthesizes an ongoing dynamic Cyberpunk Space Synth background track
  public startMusic() {
    if (!this.musicEnabled || this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    
    let step = 0;
    // Pentatonic/Minor Space scale in G minor
    // G2, Bb2, C3, D3, F3
    const bassline = [98.00, 98.00, 116.54, 116.54, 130.81, 146.83, 116.54, 98.00]; // G2, Bb2, C3, D3, etc
    const melody = [0, 392.00, 0, 466.16, 523.25, 0, 587.33, 466.16, 0, 392.00, 587.33, 0, 523.25, 466.16, 0, 392.00];
    
    this.sequencerInterval = setInterval(() => {
      if (!this.musicEnabled) return;
      try {
        const ctx = this.initContext();
        const now = ctx.currentTime;
        
        // 1. Play Bass Note every 2 beats (even steps)
        if (step % 2 === 0) {
          const bassFreq = bassline[Math.floor(step / 2) % bassline.length];
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          const bassFilter = ctx.createBiquadFilter();
          
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(bassFreq, now);
          
          bassFilter.type = 'lowpass';
          bassFilter.frequency.setValueAtTime(250, now);
          
          bassGain.gain.setValueAtTime(0.18, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          
          bassOsc.connect(bassFilter);
          bassFilter.connect(bassGain);
          bassGain.connect(ctx.destination);
          
          bassOsc.start(now);
          bassOsc.stop(now + 0.26);
        }

        // 2. Play Hi-Hat sound on odd steps for rhythm
        if (step % 2 === 1) {
          const bufferSize = ctx.sampleRate * 0.04;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          
          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(7000, now);
          
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.015, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
          
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          
          noise.start(now);
          noise.stop(now + 0.04);
        }

        // 3. Simple Ambient Melody Note
        const melNote = melody[step % melody.length];
        if (melNote > 0 && Math.random() > 0.3) {
          const melOsc = ctx.createOscillator();
          const melGain = ctx.createGain();
          
          melOsc.type = 'sine';
          melOsc.frequency.setValueAtTime(melNote, now);
          
          melGain.gain.setValueAtTime(0.03, now);
          melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          
          melOsc.connect(melGain);
          melGain.connect(ctx.destination);
          
          melOsc.start(now);
          melOsc.stop(now + 0.42);
        }

        step = (step + 1) % 16;
      } catch (e) {}
    }, 150); // 150ms per step = 100 BPM eighth notes
  }

  // Stop ambient music
  public stopMusic() {
    if (this.sequencerInterval) {
      clearInterval(this.sequencerInterval);
      this.sequencerInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const sfx = new SoundEngine();
