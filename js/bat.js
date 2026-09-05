/**
 * Bat Player Character Class
 * Represents the player-controlled bat with sonar abilities
 */
class Bat {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.baseWidth = GAME_CONFIG.BAT.BASE_WIDTH;
    this.width = this.baseWidth;
    this.height = GAME_CONFIG.BAT.HEIGHT;
    this.x = canvasWidth / 2;
    this.y = canvasHeight - GAME_CONFIG.BAT.Y_OFFSET;
    this.targetX = this.x;
    this.targetY = this.y;
    
    this.speed = GAME_CONFIG.BAT.SPEED;
    this.flapAngle = 0;
    this.flapSpeed = GAME_CONFIG.BAT.FLAP_SPEED;
    
    // Sonar & Powerups
    this.sonarEnergy = GAME_CONFIG.SONAR.MAX_ENERGY;
    this.maxSonarEnergy = GAME_CONFIG.SONAR.MAX_ENERGY;
    this.isGiant = false;
    this.giantTimer = 0;
    this.isMagnet = false;
    this.magnetTimer = 0;

    // Visual animation states - Soft Pink Theme
    this.glowColor = '#f8bbd0';
    this.eyeColor = '#f48fb1';
  }

  resize(w, h) {
    this.canvasWidth = w;
    this.canvasHeight = h;
    this.y = h - GAME_CONFIG.BAT.Y_OFFSET;
    this.targetY = this.y;
  }

  setTarget(x) {
    this.targetX = Math.max(this.width / 2, Math.min(this.canvasWidth - this.width / 2, x));
  }

  moveLeft() {
    this.setTarget(this.x - this.speed * 1.5);
  }

  moveRight() {
    this.setTarget(this.x + this.speed * 1.5);
  }

  triggerPowerup(type, duration) {
    if (type === 'giant') {
      this.isGiant = true;
      this.giantTimer = duration;
      this.width = this.baseWidth * GAME_CONFIG.BAT.GIANT_SIZE_MULTIPLIER;
    } else if (type === 'magnet') {
      this.isMagnet = true;
      this.magnetTimer = duration;
    }
  }

  update(particleSystem) {
    try {
      // Smooth lerp to target position
      this.x += (this.targetX - this.x) * GAME_CONFIG.BAT.LERP_FACTOR;

      // Wing flap oscillation
      this.flapAngle += this.flapSpeed;

      // Powerup Timers
      if (this.isGiant) {
        this.giantTimer--;
        if (this.giantTimer <= 0) {
          this.isGiant = false;
          this.width = this.baseWidth;
        }
      }

      if (this.isMagnet) {
        this.magnetTimer--;
        if (this.magnetTimer <= 0) {
          this.isMagnet = false;
        }
      }

      // Recharge Sonar Energy slowly
      if (this.sonarEnergy < this.maxSonarEnergy) {
        this.sonarEnergy = Math.min(this.maxSonarEnergy, this.sonarEnergy + GAME_CONFIG.SONAR.RECHARGE_RATE);
      }
    } catch (error) {
      console.warn('Bat update error:', error);
    }
  }

  canUseSonar() {
    return this.sonarEnergy >= GAME_CONFIG.SONAR.MIN_ENERGY_TO_USE;
  }

  useSonar(particleSystem) {
    if (!this.canUseSonar()) return false;

    try {
      this.sonarEnergy -= GAME_CONFIG.SONAR.COST;
      particleSystem.addSonarWave(this.x, this.y - 10, this.isMagnet ? '#f06292' : '#f8bbd0');
      return true;
    } catch (error) {
      console.warn('Sonar usage error:', error);
      return false;
    }
  }

  draw(ctx) {
    try {
      ctx.save();
      ctx.translate(this.x, this.y);

      const wingOffset = Math.sin(this.flapAngle) * 16;
      const halfW = this.width / 2;

      // Glow Effect - Soft Pink
      ctx.shadowColor = this.isMagnet ? '#f06292' : (this.isGiant ? '#ffc107' : '#f8bbd0');
      ctx.shadowBlur = 15;

      // 1. Draw Bat Wings (Left & Right) - Soft Pink
      ctx.fillStyle = 'rgba(252, 228, 236, 0.95)';
      ctx.strokeStyle = this.isMagnet ? '#f06292' : (this.isGiant ? '#ffc107' : '#f8bbd0');
      ctx.lineWidth = 2.5;

      // Left Wing
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-halfW * 0.5, -30 + wingOffset, -halfW, -5 + wingOffset);
      ctx.quadraticCurveTo(-halfW * 0.7, 15, -halfW * 0.4, 8);
      ctx.quadraticCurveTo(-halfW * 0.2, 18, 0, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Wing
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(halfW * 0.5, -30 + wingOffset, halfW, -5 + wingOffset);
      ctx.quadraticCurveTo(halfW * 0.7, 15, halfW * 0.4, 8);
      ctx.quadraticCurveTo(halfW * 0.2, 18, 0, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wing Membrane Lines - Soft Pink
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(-halfW * 0.5, -25 + wingOffset);
      ctx.moveTo(0, -5);
      ctx.lineTo(halfW * 0.5, -25 + wingOffset);
      ctx.strokeStyle = 'rgba(248, 187, 208, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 2. Bat Body & Head - Soft Pink
      ctx.fillStyle = '#fce4ec';
      ctx.strokeStyle = this.isMagnet ? '#f06292' : '#f8bbd0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bat Ears - Soft Pink
      ctx.beginPath();
      // Left Ear
      ctx.moveTo(-10, -8);
      ctx.lineTo(-15, -22);
      ctx.lineTo(-5, -12);
      // Right Ear
      ctx.moveTo(5, -12);
      ctx.lineTo(15, -22);
      ctx.lineTo(10, -8);
      ctx.fillStyle = '#fce4ec';
      ctx.fill();
      ctx.stroke();

      // Glowing Eyes - Soft Pink
      ctx.fillStyle = this.isMagnet ? '#f06292' : (this.isGiant ? '#ffc107' : '#f48fb1');
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(-6, -3, 3, 0, Math.PI * 2);
      ctx.arc(6, -3, 3, 0, Math.PI * 2);
      ctx.fill();

      // Magnet Aura Indicator if active
      if (this.isMagnet) {
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, halfW + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    } catch (error) {
      console.warn('Bat render error:', error);
    }
  }

  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - 15,
      bottom: this.y + 15,
      width: this.width,
      height: this.height
    };
  }
}
