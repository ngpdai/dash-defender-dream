export type ShipType = 'speeder' | 'tank';

export interface Ship {
  id: ShipType;
  name: string;
  description: string;
  speed: number;
  shield: boolean;
  lives: number;
  color: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'asteroid' | 'debris' | 'mine';
  direction?: 'left' | 'right'; // For side-coming obstacles
}

export interface SuddenEntity {
  id: string;
  x: number;
  y: number;
  spawnTime: number;
  isExploding: boolean;
}

export interface TerraStorm {
  active: boolean;
  startTime: number;
  duration: number;
  intensity: number;
}

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  score: number;
  highScore: number;
  distance: number;
  selectedShip: ShipType | null;
  playerPosition: Position;
  obstacles: Obstacle[];
  suddenEntities: SuddenEntity[];
  terraStorm: TerraStorm;
  lives: number;
  hasShield: boolean;
  difficulty: number;
  gameTime: number;
  isInvincible: boolean;
  lastHitTime: number;
}

export type GameScreen = 'menu' | 'ship-select' | 'game' | 'game-over';
