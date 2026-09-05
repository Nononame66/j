/**
 * High Performance Canvas Particle System with Optimization
 */

// Performance Configuration Constants
const PARTICLE_CONFIG = {
  MAX_PARTICLES: 300,           // Maximum total particles allowed
  MAX_SPARKS_PER_EVENT: 15,     // Maximum sparks per collision
  DUST_SPAWN_INTERVAL: 3,       // Spawn dust every N frames
  AMBIENT_DUST_LIMIT: 80,       // Maximum ambient dust particles
  POOL_SIZE: 100                // Object pool size for reuse
};

class Particle {
  constructor(x, y, vx, vy, color, radius, life, type = 'spark') {
    this.reset(x, y, vx, vy, color, radius, life, type);
  }

  reset(x, y, vx, vy, color, radius, life, type) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.radius = radius;
    this.maxLife = life;
    this.life = life;
    this.type = type; // 'spark', 'ring', 'dust', 'star'
    this.alpha = 1;
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.alpha = Math.max(0, this.life / this.maxLife);

    if (this.type === 'ring') {
      this.radius += 3.5;
    } else if (this.type === 'spark') {
      this.vy += 0.05; // light gravity
      this.radius *= 0.96;
    } else if (this.type === 'dust') {
      this.vx += (Math.random() - 0.5) * 0.02;
    }

    if (this.life <= 0) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    if (this.type === 'ring') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.5, this.radius), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.dustSpawnCounter = 0;
    this.particlePool = [];
    
    // Pre-allocate particle pool for better performance
    for (let i = 0; i < PARTICLE_CONFIG.POOL_SIZE; i++) {
      this.particlePool.push(new Particle(0, 0, 0, 0, '#fff', 1, 1, 'spark'));
    }
  }

  // Get particle from pool or create new one
  getParticle(x, y, vx, vy, color, radius, life, type) {
    let particle = this.particlePool.pop();
    if (particle) {
      particle.reset(x, y, vx, vy, color, radius, life, type);
    } else {
      particle = new Particle(x, y, vx, vy, color, radius, life, type);
    }
    return particle;
  }

  // Return particle to pool
  recycleParticle(particle) {
    if (this.particlePool.length < PARTICLE_CONFIG.POOL_SIZE) {
      particle.active = false;
      this.particlePool.push(particle);
    }
  }

  addSpark(x, y, color = '#00f3ff', count = 10) {
    // Limit total particles and sparks per event
    if (this.particles.length >= PARTICLE_CONFIG.MAX_PARTICLES) return;
    
    const maxSparks = Math.min(count, PARTICLE_CONFIG.MAX_SPARKS_PER_EVENT);
    const sparkCount = Math.min(maxSparks, PARTICLE_CONFIG.MAX_PARTICLES - this.particles.length);

    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const radius = 2 + Math.random() * 3;
      const life = 20 + Math.random() * 25;
      
      const particle = this.getParticle(x, y, vx, vy, color, radius, life, 'spark');
      this.particles.push(particle);
    }
  }

  addSonarWave(x, y, color = '#00f3ff') {
    if (this.particles.length >= PARTICLE_CONFIG.MAX_PARTICLES) return;
    
    const particle = this.getParticle(x, y, 0, 0, color, 10, 40, 'ring');
    this.particles.push(particle);
  }

  addAmbientDust(width, height) {
    // Throttle dust spawning - only spawn every N frames
    this.dustSpawnCounter++;
    if (this.dustSpawnCounter < PARTICLE_CONFIG.DUST_SPAWN_INTERVAL) return;
    this.dustSpawnCounter = 0;

    // Count current dust particles
    const dustCount = this.particles.filter(p => p.type === 'dust').length;
    if (dustCount >= PARTICLE_CONFIG.AMBIENT_DUST_LIMIT) return;
    if (this.particles.length >= PARTICLE_CONFIG.MAX_PARTICLES) return;

    const x = Math.random() * width;
    const y = height + 10;
    const vx = (Math.random() - 0.5) * 0.4;
    const vy = - (0.3 + Math.random() * 0.5);
    const color = Math.random() > 0.5 ? '#f8bbd0' : '#fce4ec'; // Soft pink sparkles
    const radius = 1 + Math.random() * 2;
    const life = 120 + Math.random() * 180;
    
    const particle = this.getParticle(x, y, vx, vy, color, radius, life, 'dust');
    this.particles.push(particle);
  }

  update() {
    // Update and remove dead particles in one pass
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      
      if (!p.active || p.life <= 0) {
        this.recycleParticle(p);
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // Batch drawing for better performance
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].draw(ctx);
    }
  }

  clear() {
    // Return all particles to pool before clearing
    for (const particle of this.particles) {
      this.recycleParticle(particle);
    }
    this.particles = [];
    this.dustSpawnCounter = 0;
  }

  // Get current particle count (for debugging/monitoring)
  getParticleCount() {
    return this.particles.length;
  }

  // Get performance stats
  getStats() {
    const types = { spark: 0, ring: 0, dust: 0, star: 0 };
    this.particles.forEach(p => {
      if (types[p.type] !== undefined) types[p.type]++;
    });
    return {
      total: this.particles.length,
      poolSize: this.particlePool.length,
      types
    };
  }
}
