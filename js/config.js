/**
 * Game Configuration Constants
 * Central configuration file for all game settings
 */

const GAME_CONFIG = {
  // Canvas & Display
  CANVAS_MAX_WIDTH: 1200,
  CANVAS_MAX_HEIGHT: 700,
  DEVICE_PIXEL_RATIO_MAX: 2,

  // Player Bat Settings
  BAT: {
    BASE_WIDTH: 110,
    HEIGHT: 30,
    SPEED: 12,
    FLAP_SPEED: 0.15,
    Y_OFFSET: 70, // Distance from bottom
    LERP_FACTOR: 0.25, // Smooth movement (0-1)
    GIANT_SIZE_MULTIPLIER: 1.5,
    GIANT_DURATION: 350, // frames
    MAGNET_DURATION: 350, // frames
    MAGNET_RANGE: 220 // pixels
  },

  // Sonar Mechanics
  SONAR: {
    MAX_ENERGY: 100,
    COST: 35,
    RECHARGE_RATE: 0.2,
    MIN_ENERGY_TO_USE: 30,
    IMPULSE_RANGE: 260, // pixels
    IMPULSE_STRENGTH: 3 // velocity boost
  },

  // Ball Physics
  BALL: {
    RADIUS: 12,
    GOLD_RADIUS: 14,
    INITIAL_VY_MIN: -5,
    INITIAL_VY_MAX: -8,
    INITIAL_VX_RANGE: 6,
    MAX_TRAIL_LENGTH: 8,
    SPEED_INCREASE_ON_HIT: 1.03,
    MIN_SPEED: 7,
    MAX_BOUNCE_ANGLE: Math.PI / 3 * 0.85 // ~50 degrees
  },

  // Scoring & Progression
  SCORE: {
    HIT_BASE: 10,
    MAX_COMBO_MULTIPLIER: 5,
    RESCUE_BASE: 150,
    RESCUE_COMBO_BONUS: 20,
    BALLS_PER_LEVEL: 5,
    COMBO_POPUP_THRESHOLD: 3
  },

  // Game Modes
  MODES: {
    ARCADE: {
      LIVES: 3,
      PORTALS: 2
    },
    SURVIVAL: {
      LIVES: 5,
      PORTALS: 3,
      SPAWN_INTERVAL: 280 // frames
    },
    CHALLENGE: {
      LIVES: 3,
      PORTALS: 2,
      STALACTITE_INTERVAL: 180 // frames
    }
  },

  // Power-ups
  POWERUP: {
    DROP_CHANCE: 0.45,
    FALL_SPEED: 2.5,
    RADIUS: 16,
    TYPES: ['giant', 'magnet', 'shield', 'slow', 'multiball']
  },

  // Floor Shield
  SHIELD: {
    DURATION: 450, // frames
    Y_OFFSET: 15 // pixels from bottom
  },

  // Slow Motion
  SLOW_MOTION: {
    FACTOR: 0.55,
    DURATION: 300 // frames
  },

  // Stalactite (Challenge Mode)
  STALACTITE: {
    WIDTH: 18,
    HEIGHT: 36,
    FALL_SPEED_MIN: 3.5,
    FALL_SPEED_MAX: 6
  },

  // Portal Crystal
  PORTAL: {
    RADIUS: 36,
    PULSE_AMPLITUDE: 4,
    ROTATION_SPEED: 0.03,
    Y_POSITION: 110, // from top
    Y_OFFSET_VARIATION: 30
  },

  // UI & Animation
  UI: {
    TUTORIAL_DELAY: 400, // ms
    COMBO_POPUP_DURATION: 1000, // ms
    DAMAGE_FLASH_DURATION: 400, // ms
    MODAL_ANIMATION_DURATION: 400 // ms
  },

  // Storage Keys
  STORAGE: {
    HIGH_SCORE: 'bat_rescue_highscore',
    TUTORIAL_SEEN: 'bat_rescue_seen_tutorial',
    SETTINGS: 'bat_rescue_settings'
  },

  // Performance
  PERFORMANCE: {
    MAX_FPS: 60,
    MIN_FRAME_TIME: 1000 / 60
  }
};

// Freeze config to prevent accidental modification
Object.freeze(GAME_CONFIG);
Object.freeze(GAME_CONFIG.BAT);
Object.freeze(GAME_CONFIG.SONAR);
Object.freeze(GAME_CONFIG.BALL);
Object.freeze(GAME_CONFIG.SCORE);
Object.freeze(GAME_CONFIG.MODES);
Object.freeze(GAME_CONFIG.POWERUP);
Object.freeze(GAME_CONFIG.SHIELD);
Object.freeze(GAME_CONFIG.SLOW_MOTION);
Object.freeze(GAME_CONFIG.STALACTITE);
Object.freeze(GAME_CONFIG.PORTAL);
Object.freeze(GAME_CONFIG.UI);
Object.freeze(GAME_CONFIG.STORAGE);
Object.freeze(GAME_CONFIG.PERFORMANCE);
