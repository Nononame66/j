/**
 * Web Audio API Sound Engine
 * Generates custom sound effects and supports external audio files for BGM
 */

// Audio Configuration Constants
const AUDIO_CONFIG = {
  MASTER_VOLUME: 0.7,
  SFX_VOLUME: 0.3,
  BGM_VOLUME: 0.4, // Increased for file-based BGM
  BGM_FADE_DURATION: 0.5,
  MAX_CONCURRENT_SOUNDS: 8,
  BGM_FILE: 'assets/audio/bgm.mp3', // Path to your background music file
  USE_EXTERNAL_BGM: true // Set to false to use procedural BGM
};

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volume = AUDIO_CONFIG.MASTER_VOLUME;
    this.bgmNode = null;
    this.bgmGain = null;
    this.isPlayingBGM = false;
    this.activeSounds = [];
    this.bgmOscillators = [];
    this.userInteracted = false;
    
    // For external audio file
    this.bgmAudioElement = null;
    this.bgmSource = null;
    
    // Setup user interaction listener for mobile autoplay policy
    this.setupInteractionListener();
  }

  setupInteractionListener() {
    const enableAudio = () => {
      if (!this.userInteracted) {
        this.userInteracted = true;
        this.init();
        // Remove listeners after first interaction
        document.removeEventListener('touchstart', enableAudio);
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('keydown', enableAudio);
      }
    };

    document.addEventListener('touchstart', enableAudio, { once: true, passive: true });
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        } else {
          console.warn('Web Audio API not supported in this browser');
          return false;
        }
      }
      
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(err => {
          console.warn('Audio context resume failed:', err);
        });
      }
      
      return true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      return false;
    }
  }

  // Clean up old sounds to prevent memory leaks
  cleanupActiveSounds() {
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.activeSounds = this.activeSounds.filter(sound => sound.endTime > now);
    
    // Limit concurrent sounds
    if (this.activeSounds.length > AUDIO_CONFIG.MAX_CONCURRENT_SOUNDS) {
      this.activeSounds.shift(); // Remove oldest sound
    }
  }

  playBounce(ballSpeed = 1) {
    if (this.isMuted || !this.init()) return;
    
    try {
      this.cleanupActiveSounds();
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = Math.min(800, 300 + ballSpeed * 40);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, this.ctx.currentTime + 0.08);

      const vol = AUDIO_CONFIG.SFX_VOLUME * this.volume;
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const startTime = this.ctx.currentTime;
      const endTime = startTime + 0.1;
      
      osc.start(startTime);
      osc.stop(endTime);
      
      this.activeSounds.push({ osc, gain, endTime });
    } catch (error) {
      console.warn('Bounce sound failed:', error);
    }
  }

  playSonar() {
    if (this.isMuted || !this.init()) return;
    
    try {
      this.cleanupActiveSounds();
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.35);

      const vol = AUDIO_CONFIG.SFX_VOLUME * this.volume * 1.2;
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const startTime = this.ctx.currentTime;
      const endTime = startTime + 0.4;
      
      osc.start(startTime);
      osc.stop(endTime);
      
      this.activeSounds.push({ osc, gain, endTime });
    } catch (error) {
      console.warn('Sonar sound failed:', error);
    }
  }

  playRescue() {
    if (this.isMuted || !this.init()) return;
    
    try {
      this.cleanupActiveSounds();
      
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);

        const vol = AUDIO_CONFIG.SFX_VOLUME * this.volume * 0.8;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const startTime = this.ctx.currentTime + idx * 0.06;
        const endTime = startTime + 0.25;
        
        osc.start(startTime);
        osc.stop(endTime);
        
        this.activeSounds.push({ osc, gain, endTime });
      });
    } catch (error) {
      console.warn('Rescue sound failed:', error);
    }
  }

  playPowerup() {
    if (this.isMuted || !this.init()) return;
    
    try {
      this.cleanupActiveSounds();
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.2);

      const vol = AUDIO_CONFIG.SFX_VOLUME * this.volume * 0.7;
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const startTime = this.ctx.currentTime;
      const endTime = startTime + 0.25;
      
      osc.start(startTime);
      osc.stop(endTime);
      
      this.activeSounds.push({ osc, gain, endTime });
    } catch (error) {
      console.warn('Powerup sound failed:', error);
    }
  }

  playHurt() {
    if (this.isMuted || !this.init()) return;
    
    try {
      this.cleanupActiveSounds();
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.3);

      const vol = AUDIO_CONFIG.SFX_VOLUME * this.volume * 1.3;
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const startTime = this.ctx.currentTime;
      const endTime = startTime + 0.35;
      
      osc.start(startTime);
      osc.stop(endTime);
      
      this.activeSounds.push({ osc, gain, endTime });
    } catch (error) {
      console.warn('Hurt sound failed:', error);
    }
  }

  playGameOver() {
    if (this.isMuted || !this.init()) return;
    
    try {
      this.cleanupActiveSounds();
      
      const notes = [440, 415.30, 392.00, 349.23];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.15);

        const vol = AUDIO_CONFIG.SFX_VOLUME * this.volume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.15 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        const startTime = this.ctx.currentTime + idx * 0.15;
        const endTime = startTime + 0.4;
        
        osc.start(startTime);
        osc.stop(endTime);
        
        this.activeSounds.push({ osc, gain, endTime });
      });
    } catch (error) {
      console.warn('Game over sound failed:', error);
    }
  }

  toggleBGM() {
    if (this.isPlayingBGM) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
  }

  startBGM() {
    if (this.isPlayingBGM || this.isMuted || !this.init()) return;
    
    try {
      this.stopBGM(); // Clean up any existing BGM first
      
      this.isPlayingBGM = true;

      // Try to use external audio file first
      if (AUDIO_CONFIG.USE_EXTERNAL_BGM) {
        this.startExternalBGM();
      } else {
        this.startProceduralBGM();
      }
      
    } catch (error) {
      console.error('BGM start failed:', error);
      this.isPlayingBGM = false;
      // Fallback to procedural if file fails
      if (AUDIO_CONFIG.USE_EXTERNAL_BGM) {
        console.log('Falling back to procedural BGM');
        this.startProceduralBGM();
      }
    }
  }

  startExternalBGM() {
    try {
      // Create HTML5 Audio element for the background music
      if (!this.bgmAudioElement) {
        this.bgmAudioElement = new Audio(AUDIO_CONFIG.BGM_FILE);
        this.bgmAudioElement.loop = true;
        this.bgmAudioElement.volume = AUDIO_CONFIG.BGM_VOLUME * this.volume;
        
        // Handle loading errors - fallback to procedural
        this.bgmAudioElement.addEventListener('error', (e) => {
          console.warn('BGM file failed to load, using procedural audio:', e);
          this.startProceduralBGM();
        });

        this.bgmAudioElement.addEventListener('canplaythrough', () => {
          console.log('BGM loaded successfully');
        });
      }

      // Play the audio
      const playPromise = this.bgmAudioElement.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('BGM playing');
        }).catch(error => {
          console.warn('BGM autoplay blocked:', error);
          // Will play after user interaction
        });
      }

    } catch (error) {
      console.error('External BGM failed:', error);
      this.startProceduralBGM();
    }
  }

  startProceduralBGM() {
    try {
      if (!this.ctx) return;
      
      this.bgmOscillators = [];
      
      // Create richer ambient atmosphere with chord
      this.bgmGain = this.ctx.createGain();
      
      // Chord: A2, E3, A3, C#4 (Am chord for mysterious atmosphere)
      const frequencies = [110, 164.81, 220, 277.18];
      
      frequencies.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        
        osc.type = idx < 2 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        // Slight detuning for richness
        if (idx > 0) {
          osc.detune.setValueAtTime(Math.random() * 4 - 2, this.ctx.currentTime);
        }
        
        const vol = idx === 0 ? 1 : 0.6;
        oscGain.gain.setValueAtTime(vol, this.ctx.currentTime);
        
        osc.connect(oscGain);
        oscGain.connect(this.bgmGain);
        
        this.bgmOscillators.push({ osc, oscGain });
      });
      
      // Master BGM volume with fade in
      const targetVol = AUDIO_CONFIG.BGM_VOLUME * this.volume * 0.2; // Lower for procedural
      this.bgmGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.bgmGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + AUDIO_CONFIG.BGM_FADE_DURATION);
      
      this.bgmGain.connect(this.ctx.destination);

      // Start all oscillators
      this.bgmOscillators.forEach(({ osc }) => osc.start());
      
    } catch (error) {
      console.error('Procedural BGM failed:', error);
    }
  }

  stopBGM() {
    try {
      // Stop HTML5 Audio element
      if (this.bgmAudioElement) {
        this.bgmAudioElement.pause();
        this.bgmAudioElement.currentTime = 0;
      }

      // Stop procedural oscillators
      if (this.bgmGain && this.ctx) {
        this.bgmGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + AUDIO_CONFIG.BGM_FADE_DURATION);
      }
      
      if (this.bgmOscillators.length > 0) {
        const stopTime = this.ctx ? this.ctx.currentTime + AUDIO_CONFIG.BGM_FADE_DURATION : 0;
        this.bgmOscillators.forEach(({ osc }) => {
          try {
            osc.stop(stopTime);
          } catch (e) {
            // Oscillator may already be stopped
          }
        });
        this.bgmOscillators = [];
      }
      
      // Stop old bgmNode for backwards compatibility
      if (this.bgmNode) {
        try {
          this.bgmNode.osc1.stop();
          this.bgmNode.osc2.stop();
        } catch (e) {
          // Oscillators may already be stopped
        }
        this.bgmNode = null;
      }
    } catch (error) {
      console.warn('BGM stop error:', error);
    }
    
    this.isPlayingBGM = false;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
      // Stop all active sounds
      this.activeSounds = [];
    } else if (this.userInteracted) {
      // Resume audio context if needed
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(err => console.warn('Resume failed:', err));
      }
    }
    return this.isMuted;
  }

  // Set master volume (0.0 to 1.0)
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    
    // Update BGM volume if playing
    if (this.isPlayingBGM) {
      if (this.bgmAudioElement) {
        this.bgmAudioElement.volume = AUDIO_CONFIG.BGM_VOLUME * this.volume;
      }
      if (this.bgmGain && this.ctx) {
        const targetVol = AUDIO_CONFIG.BGM_VOLUME * this.volume * 0.2;
        this.bgmGain.gain.setValueAtTime(targetVol, this.ctx.currentTime);
      }
    }
    
    return this.volume;
  }

  getVolume() {
    return this.volume;
  }

  // Cleanup method for game reset
  cleanup() {
    this.stopBGM();
    this.activeSounds = [];
  }
}

const audio = new SoundEngine();
