export type ShipType = 'speeder' | 'tank';

export interface HitboxConfig {
  width: number;
  height: number;
}

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
  passed?: boolean; // Track if obstacle has been counted for dodge score
}

export interface DodgePopup {
  id: string;
  x: number;
  y: number;
  createdAt: number;
}

export interface SuddenEntity {
  id: string;
  x: number;
  y: number;
  spawnTime: number;
  isExploding: boolean;
}

// ========================================
// POWER-UP - VẬT PHẨM HỒI SHIELD/HP
// ========================================
// Vật phẩm rơi từ trên xuống, người chơi thu thập để hồi shield (Speeder) hoặc HP (Titan)
export interface PowerUp {
  id: string;          // ID duy nhất của power-up
  x: number;           // Tọa độ X (phần trăm, 0-100%)
  y: number;           // Tọa độ Y (bắt đầu từ ngoài màn hình, rơi xuống)
  spawnTime: number;   // Thời điểm spawn (dùng cho animation)
  collected: boolean;  // Đã được thu thập chưa
}

// ========================================
// POWER-UP FLOATING TEXT - TEXT PHẢN HỒI
// ========================================
// Text bay lên từ vị trí tàu khi thu thập power-up, hiển thị trạng thái (hồi thành công / đã full)
export interface PowerUpPopup {
  id: string;          // ID duy nhất
  x: number;           // Tọa độ X (phần trăm)
  y: number;           // Tọa độ Y (phần trăm)
  text: string;        // Nội dung text ("SHIELD RESTORED!", "HP FULL", v.v.)
  color: 'green' | 'orange'; // Màu: xanh lá = thành công, cam = đã full
  createdAt: number;   // Thời điểm tạo (dùng để tự xóa sau 1 giây)
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
  dodgePopups: DodgePopup[];
  showHitboxes: boolean;
  // Overdrive buff system
  overdriveActive: boolean;
  overdriveShields: number;
  overdriveStartTime: number;
  overdriveScoreRate: number; // points per second to drain
  // Ending system
  endingTriggered: boolean;
  flashActive: boolean;
  flashColor: 'white' | 'cyan';
  // ========================================
  // HỆ THỐNG POWER-UP
  // ========================================
  powerUps: PowerUp[];              // Danh sách power-up đang tồn tại trên màn hình
  powerUpPopups: PowerUpPopup[];    // Danh sách floating text phản hồi
  lastPowerUpMilestone: number;     // Milestone cuối cùng đã spawn power-up (VD: 24000, 23000...)
}

export type GameScreen = 'menu' | 'ship-select' | 'game' | 'game-over' | 'ending-scene';
