/**
 * Main Game Controller Engine
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER
    this.mode = 'arcade'; // arcade, survival, challenge

    // Game stats
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('bat_rescue_highscore') || '0', 10);
    this.lives = 3;
    this.level = 1;
    this.combo = 0;
    this.savedBallsCount = 0;

    // Entities
    this.bat = null;
    this.balls = [];
    this.portals = [];
    this.powerups = [];
    this.stalactites = [];
    this.floorShield = null;
    this.particleSystem = new ParticleSystem();

    // Timers & Modifiers
    this.slowMotionFactor = 1;
    this.slowMotionTimer = 0;
    this.spawnTimer = 0;
    this.stalactiteTimer = 0;

    // Inputs
    this.keys = { left: false, right: false, sonar: false };
    
    // Mobile detection & haptic support
    this.isMobile = this.detectMobile();
    this.hasHaptic = 'vibrate' in navigator;
    
    this.initCanvas();
    this.initEventListeners();
    this.updateHUD();
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
      || window.matchMedia('(pointer: coarse)').matches;
  }

  // Haptic feedback for mobile devices
  vibrate(pattern = 10) {
    if (this.hasHaptic && this.isMobile && this.state === 'PLAYING') {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Vibration API not supported or failed
      }
    }
  }

  initCanvas() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    try {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;

      // Render at device pixel ratio so the game stays sharp on phone screens
      const dpr = Math.min(window.devicePixelRatio || 1, GAME_CONFIG.DEVICE_PIXEL_RATIO_MAX);
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (this.bat) {
        this.bat.resize(this.width, this.height);
      }
      if (this.floorShield) {
        this.floorShield.width = this.width;
        this.floorShield.height = this.height;
      }
    } catch (error) {
      console.error('Canvas resize failed:', error);
    }
  }

  initEventListeners() {
    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      if (this.state !== 'PLAYING' || !this.bat) return;
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      this.bat.setTarget(mouseX);
    });

    // Touch support with improved handling
    let lastTouchX = null;
    
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.state !== 'PLAYING' || !this.bat) return;
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      lastTouchX = touchX;
      this.bat.setTarget(touchX);
      
      // Haptic feedback on touch start
      this.vibrate(5);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.state !== 'PLAYING' || !this.bat) return;
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      
      // Smooth interpolation for better mobile feel
      if (lastTouchX !== null) {
        const smoothedX = lastTouchX * 0.3 + touchX * 0.7;
        this.bat.setTarget(smoothedX);
        lastTouchX = smoothedX;
      } else {
        this.bat.setTarget(touchX);
        lastTouchX = touchX;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', () => {
      lastTouchX = null;
    }, { passive: false });

    // Dedicated sonar button with haptic feedback
    const sonarBtn = document.getElementById('sonarBtn');
    if (sonarBtn) {
      const handleSonar = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.state === 'PLAYING') {
          const success = this.triggerSonar();
          if (success) {
            // Haptic feedback on successful sonar
            this.vibrate([10, 20, 10]);
            
            // Visual feedback
            sonarBtn.style.transform = 'scale(0.9)';
            setTimeout(() => {
              sonarBtn.style.transform = 'scale(1)';
            }, 100);
          } else {
            // Different vibration for failed sonar (low energy)
            this.vibrate(5);
          }
        }
      };
      
      sonarBtn.addEventListener('touchstart', handleSonar, { passive: false });
      sonarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.state === 'PLAYING') this.triggerSonar();
      });
    }

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerSonar();
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });

    // UI Buttons
    document.getElementById('startBtn').addEventListener('click', () => this.startGame());
    document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
    document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
    document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());

    document.getElementById('muteBtn').addEventListener('click', () => {
      const isMuted = audio.toggleMute();
      document.getElementById('muteBtn').textContent = isMuted ? '🔇' : '🔊';
      this.syncPauseMuteLabel(isMuted);
    });

    // Pause menu extras
    document.getElementById('pauseRestartBtn').addEventListener('click', () => this.startGame());
    document.getElementById('pauseExitBtn').addEventListener('click', () => this.exitToMenu());
    document.getElementById('pauseMuteBtn').addEventListener('click', () => {
      const isMuted = audio.toggleMute();
      document.getElementById('muteBtn').textContent = isMuted ? '🔇' : '🔊';
      this.syncPauseMuteLabel(isMuted);
    });

    // Mode Selector Buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mode = btn.dataset.mode;
        
        // Haptic feedback on mode selection
        this.vibrate(8);
      });
    });

    // Prevent context menu on long press (mobile)
    if (this.isMobile) {
      document.addEventListener('contextmenu', (e) => {
        if (e.target === this.canvas || e.target.closest('.sonar-btn')) {
          e.preventDefault();
        }
      });
    }

    // Pause on visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'PLAYING') {
        this.togglePause();
      }
    });
  }

  triggerSonar() {
    if (this.bat && this.bat.useSonar(this.particleSystem)) {
      audio.playSonar();

      // Sonar impulse: Bounces nearby balls upwards or pulls them - Soft pink sparkles
      this.balls.forEach(ball => {
        const dist = Math.hypot(ball.x - this.bat.x, ball.y - this.bat.y);
        if (dist < 260) {
          ball.vy = -Math.abs(ball.vy) - 3;
          ball.vx += (ball.x - this.bat.x) * 0.05;
          this.particleSystem.addSpark(ball.x, ball.y, '#f8bbd0', 12);
        }
      });
      
      return true;
    }
    return false;
  }

  startGame() {
    try {
      this.score = 0;
      this.lives = this.mode === 'survival' ? GAME_CONFIG.MODES.SURVIVAL.LIVES : GAME_CONFIG.MODES.ARCADE.LIVES;
      this.level = 1;
      this.combo = 0;
      this.savedBallsCount = 0;

      this.bat = new Bat(this.width, this.height);
      this.floorShield = new FloorShield(this.width, this.height);
      this.balls = [];
      this.portals = [];
      this.powerups = [];
      this.stalactites = [];
      this.particleSystem.clear();

      // Spawn initial ball
      this.spawnBall();

      // Create Rescue Portals near top
      if (this.mode !== 'survival') {
        this.spawnPortals();
      }

      this.state = 'PLAYING';
      document.getElementById('menuOverlay').classList.add('hidden');
      document.getElementById('gameOverOverlay').classList.add('hidden');
      document.getElementById('pauseOverlay').classList.add('hidden');

      audio.startBGM();
      this.updateHUD();
      this.maybeShowTutorialHint();

      if (!this.loopRunning) {
        this.loopRunning = true;
        requestAnimationFrame(() => this.loop());
      }
    } catch (error) {
      console.error('Game start failed:', error);
      alert('Gagal memulai game. Silakan refresh halaman.');
    }
  }

  maybeShowTutorialHint() {
    try {
      if (localStorage.getItem(GAME_CONFIG.STORAGE.TUTORIAL_SEEN)) return;
      localStorage.setItem(GAME_CONFIG.STORAGE.TUTORIAL_SEEN, '1');

      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const tip = isTouch
        ? 'Geser layar untuk gerakkan kelelawar, ketuk tombol 🔊 untuk sonar!'
        : 'Gunakan mouse/panah untuk gerak, Spasi untuk tembak sonar!';

      setTimeout(() => {
        this.showComboPopup(tip, this.width / 2 - 140, this.height * 0.4);
      }, GAME_CONFIG.UI.TUTORIAL_DELAY);
    } catch (error) {
      console.warn('Tutorial hint failed:', error);
    }
  }

  spawnBall(type = 'normal') {
    const ball = new Ball(
      this.width / 2 + (Math.random() - 0.5) * 100,
      this.height * 0.3,
      (Math.random() - 0.5) * 6,
      -5 - Math.random() * 2,
      type
    );
    this.balls.push(ball);
  }

  spawnPortals() {
    try {
      this.portals = [];
      const count = this.mode === 'arcade' ? GAME_CONFIG.MODES.ARCADE.PORTALS : GAME_CONFIG.MODES.SURVIVAL.PORTALS;
      const spacing = this.width / (count + 1);

      for (let i = 1; i <= count; i++) {
        const yPos = GAME_CONFIG.PORTAL.Y_POSITION + (i % 2) * GAME_CONFIG.PORTAL.Y_OFFSET_VARIATION;
        this.portals.push(new RescuePortal(spacing * i, yPos, GAME_CONFIG.PORTAL.RADIUS));
      }
    } catch (error) {
      console.error('Portal spawn failed:', error);
    }
  }

  spawnPowerup(x, y) {
    try {
      const types = GAME_CONFIG.POWERUP.TYPES;
      const selected = types[Math.floor(Math.random() * types.length)];
      this.powerups.push(new PowerupItem(x, y, selected));
    } catch (error) {
      console.warn('Powerup spawn failed:', error);
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.syncPauseMuteLabel(audio.isMuted);
      document.getElementById('pauseOverlay').classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      document.getElementById('pauseOverlay').classList.add('hidden');
      requestAnimationFrame(() => this.loop());
    }
  }

  syncPauseMuteLabel(isMuted) {
    document.getElementById('pauseMuteBtn').textContent = isMuted ? '🔇 Suara: Mati' : '🔊 Suara: Nyala';
  }

  exitToMenu() {
    this.state = 'MENU';
    audio.stopBGM();
    document.getElementById('pauseOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('menuOverlay').classList.remove('hidden');
  }

  flashDamage() {
    const el = document.getElementById('damageFlash');
    if (!el) return;
    el.classList.remove('active');
    // Force reflow so the animation restarts if it's already active
    void el.offsetWidth;
    el.classList.add('active');
  }

  showComboPopup(text, x, y) {
    const container = document.getElementById('canvasContainer');
    const pop = document.createElement('div');
    pop.className = 'combo-popup';
    pop.textContent = text;
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    container.appendChild(pop);

    setTimeout(() => {
      if (pop.parentElement) pop.parentElement.removeChild(pop);
    }, 1000);
  }

  update() {
    if (this.state !== 'PLAYING') return;

    try {
      // Keyboard bat navigation
      if (this.keys.left) this.bat.moveLeft();
      if (this.keys.right) this.bat.moveRight();

      // Slow motion timer
      if (this.slowMotionTimer > 0) {
        this.slowMotionTimer--;
        this.slowMotionFactor = GAME_CONFIG.SLOW_MOTION.FACTOR;
        if (this.slowMotionTimer <= 0) this.slowMotionFactor = 1;
      }

      // Update Entities
      this.bat.update(this.particleSystem);
      this.floorShield.update(this.particleSystem);
      this.particleSystem.addAmbientDust(this.width, this.height);
      this.particleSystem.update();

      // Portals Update
      this.portals.forEach(p => p.update(this.particleSystem));

      // Survival mode auto-spawn ball timer
      if (this.mode === 'survival') {
        this.spawnTimer++;
        if (this.spawnTimer > GAME_CONFIG.MODES.SURVIVAL.SPAWN_INTERVAL) {
          this.spawnTimer = 0;
          if (this.balls.length < 6) this.spawnBall();
        }
      }

      // Challenge mode stalactite drop
      if (this.mode === 'challenge') {
        this.stalactiteTimer++;
        if (this.stalactiteTimer > GAME_CONFIG.MODES.CHALLENGE.STALACTITE_INTERVAL) {
          this.stalactiteTimer = 0;
          this.stalactites.push(new Stalactite(50 + Math.random() * (this.width - 100), 0));
        }
      }

      // Stalactite Updates & Collisions
      for (let i = this.stalactites.length - 1; i >= 0; i--) {
        const st = this.stalactites[i];
        st.update();

        if (st.checkHitBat(this.bat)) {
          this.stalactites.splice(i, 1);
          this.particleSystem.addSpark(this.bat.x, this.bat.y, '#ff0055', 20);
          audio.playHurt();
          this.loseLife();
          continue;
        }

        if (st.y > this.height) {
          this.stalactites.splice(i, 1);
        }
      }

      // Powerups Update
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        const pw = this.powerups[i];
        pw.update();

        if (pw.checkCatch(this.bat)) {
          this.applyPowerup(pw.type);
          this.particleSystem.addSpark(pw.x, pw.y, pw.colors[pw.type], 15);
          audio.playPowerup();
          this.showComboPopup(`POWER-UP!`, pw.x, pw.y);
          this.powerups.splice(i, 1);
          continue;
        }

        if (pw.y > this.height) {
          this.powerups.splice(i, 1);
        }
      }

      // Balls Update & Collision
      for (let i = this.balls.length - 1; i >= 0; i--) {
        const ball = this.balls[i];
        ball.update(this.width, this.height, this.particleSystem, this.slowMotionFactor);

        // Bat Bounce Check
        if (ball.checkBatCollision(this.bat, this.particleSystem, audio)) {
          this.combo++;
          const points = GAME_CONFIG.SCORE.HIT_BASE * Math.min(this.combo, GAME_CONFIG.SCORE.MAX_COMBO_MULTIPLIER);
          this.score += points;
          if (this.combo >= GAME_CONFIG.SCORE.COMBO_POPUP_THRESHOLD && this.combo % GAME_CONFIG.SCORE.COMBO_POPUP_THRESHOLD === 0) {
            this.showComboPopup(`COMBO x${this.combo}!`, ball.x, ball.y - 20);
          }
        }

        // Check Floor Shield Save
        this.floorShield.checkBallSave(ball, this.particleSystem, audio);

        // Portal Rescue Check
        let rescued = false;
        for (const portal of this.portals) {
          if (portal.checkRescue(ball, this.particleSystem, audio)) {
            rescued = true;
            this.savedBallsCount++;
            const rescuePoints = GAME_CONFIG.SCORE.RESCUE_BASE + this.combo * GAME_CONFIG.SCORE.RESCUE_COMBO_BONUS;
            this.score += rescuePoints;
            this.showComboPopup(`DISELAMATKAN! +${rescuePoints}`, portal.x, portal.y);

            // Chance to drop powerup
            if (Math.random() < GAME_CONFIG.POWERUP.DROP_CHANCE) {
              this.spawnPowerup(portal.x, portal.y);
            }

            // Level Up check
            if (this.savedBallsCount % GAME_CONFIG.SCORE.BALLS_PER_LEVEL === 0) {
              this.levelUp();
            }
            break;
          }
        }

        if (rescued) {
          this.balls.splice(i, 1);
          this.spawnBall(Math.random() < 0.25 ? 'gold' : 'normal');
          continue;
        }

        // Check if Ball Fell Into Abyss Bottom
        if (ball.y - ball.radius > this.height) {
          this.balls.splice(i, 1);
          this.combo = 0;

          // If no balls remaining, lose a life
          if (this.balls.length === 0) {
            audio.playHurt();
            this.loseLife();
            if (this.lives > 0) {
              this.spawnBall();
            }
          }
        }
      }

      this.updateHUD();
    } catch (error) {
      console.error('Game update error:', error);
      // Don't stop the game loop, just log the error
    }
  }

  applyPowerup(type) {
    try {
      if (type === 'giant') {
        this.bat.triggerPowerup('giant', GAME_CONFIG.BAT.GIANT_DURATION);
      } else if (type === 'magnet') {
        this.bat.triggerPowerup('magnet', GAME_CONFIG.BAT.MAGNET_DURATION);
      } else if (type === 'shield') {
        this.floorShield.activate(GAME_CONFIG.SHIELD.DURATION);
      } else if (type === 'slow') {
        this.slowMotionTimer = GAME_CONFIG.SLOW_MOTION.DURATION;
      } else if (type === 'multiball') {
        this.spawnBall('gold');
        this.spawnBall('normal');
      }
    } catch (error) {
      console.warn('Powerup application failed:', error);
    }
  }

  loseLife() {
    this.lives--;
    this.flashDamage();
    this.updateHUD();
    
    // Haptic feedback on damage
    this.vibrate([50, 30, 50]);

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  levelUp() {
    this.level++;
    audio.playRescue();
    this.showComboPopup(`LEVEL ${this.level}!`, this.width / 2 - 50, this.height / 2);
    
    // Haptic feedback on level up
    this.vibrate([30, 20, 30, 20, 30]);
  }

  gameOver() {
    try {
      this.state = 'GAMEOVER';
      audio.playGameOver();

      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem(GAME_CONFIG.STORAGE.HIGH_SCORE, this.highScore.toString());
      }

      document.getElementById('finalScore').textContent = this.score;
      document.getElementById('finalHighScore').textContent = this.highScore;
      document.getElementById('finalSaved').textContent = this.savedBallsCount;
      document.getElementById('gameOverOverlay').classList.remove('hidden');
    } catch (error) {
      console.error('Game over screen failed:', error);
    }
  }

  updateHUD() {
    try {
      document.getElementById('scoreVal').textContent = this.score;
      document.getElementById('highScoreVal').textContent = this.highScore;
      document.getElementById('livesVal').textContent = '❤️'.repeat(Math.max(0, this.lives));
      document.getElementById('levelVal').textContent = this.level;

      if (this.bat) {
        const fill = document.getElementById('sonarBarFill');
        if (fill) {
          const pct = (this.bat.sonarEnergy / this.bat.maxSonarEnergy) * 100;
          fill.style.width = `${pct}%`;
        }
      }

      // Active powerups badges UI
      const pwContainer = document.getElementById('powerupBar');
      if (pwContainer) {
        pwContainer.innerHTML = '';
        if (this.bat && this.bat.isGiant) {
          pwContainer.innerHTML += `<div class="powerup-badge">🦇 Sayap Raksasa</div>`;
        }
        if (this.bat && this.bat.isMagnet) {
          pwContainer.innerHTML += `<div class="powerup-badge">🔊 Magnet Sonar</div>`;
        }
        if (this.floorShield && this.floorShield.active) {
          pwContainer.innerHTML += `<div class="powerup-badge">🛡️ Perisai Gua</div>`;
        }
        if (this.slowMotionTimer > 0) {
          pwContainer.innerHTML += `<div class="powerup-badge">⏱️ Waktu Lambat</div>`;
        }
      }
    } catch (error) {
      console.warn('HUD update failed:', error);
    }
  }

  draw() {
    try {
      // Use offscreen canvas for better performance
      if (!this.offscreenCanvas) {
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d', { alpha: false });
      }

      // Clear canvas with soft pastel pink gradient
      const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
      bgGrad.addColorStop(0, '#fce4ec');       // Light pink
      bgGrad.addColorStop(0.5, '#f8bbd0');     // Soft pink
      bgGrad.addColorStop(1, '#f48fb1');       // Medium pink
      this.ctx.fillStyle = bgGrad;
      this.ctx.fillRect(0, 0, this.width, this.height);

      // Draw background particles (ambient dust) - OPTIMIZE: Draw less frequently
      if (!this._particleDrawSkip) this._particleDrawSkip = 0;
      this._particleDrawSkip++;
      if (this._particleDrawSkip % 2 === 0) { // Draw particles every other frame
        this.particleSystem.draw(this.ctx);
      }

      // Draw floor shield line if active
      if (this.floorShield) this.floorShield.draw(this.ctx);

      // Draw Portals
      this.portals.forEach(p => p.draw(this.ctx));

      // Draw Stalactites
      this.stalactites.forEach(s => s.draw(this.ctx));

      // Draw Power-ups
      this.powerups.forEach(pw => pw.draw(this.ctx));

      // Draw Balls
      this.balls.forEach(b => b.draw(this.ctx));

      // Draw Bat Player
      if (this.bat) this.bat.draw(this.ctx);
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  loop() {
    if (this.state === 'PLAYING') {
      try {
        // FPS limiting for better performance
        const now = performance.now();
        if (!this.lastFrameTime) this.lastFrameTime = now;
        const deltaTime = now - this.lastFrameTime;
        
        // Target 60 FPS = 16.67ms per frame
        if (deltaTime >= 16) {
          this.lastFrameTime = now - (deltaTime % 16);
          this.update();
          this.draw();
        }
        
        requestAnimationFrame(() => this.loop());
      } catch (error) {
        console.error('Game loop error:', error);
        this.togglePause();
        alert('Terjadi error dalam game. Game di-pause.');
      }
    }
  }
}

// Instantiate game on window load with error handling
window.addEventListener('DOMContentLoaded', () => {
  try {
    window.gameEngine = new Game();
  } catch (error) {
    console.error('Game initialization failed:', error);
    alert('Gagal memuat game. Silakan refresh halaman.');
  }
});
