// ============================================================================
// types/game.ts
// Tập trung TẤT CẢ kiểu dữ liệu (TypeScript types/interfaces) của game.
// Đây là "hợp đồng" chung — mọi component, hook, util đều import từ đây
// để đảm bảo dữ liệu được truyền thống nhất giữa các phần.
// ============================================================================

// Định danh loại tàu người chơi có thể chọn: 'speeder' (nhanh, ít máu)
// hoặc 'tank' (chậm, nhiều máu + shield).
export type ShipType = 'speeder' | 'tank';

// Kích thước hộp va chạm (hitbox) của một đối tượng — dùng để tính collision
// thay vì lấy nguyên kích thước hình ảnh (hitbox thường nhỏ hơn sprite).
export interface HitboxConfig {
  width: number;
  height: number;
}

// Mô tả 1 con tàu: thông số gameplay (tốc độ, máu, shield) + thông tin hiển thị.
export interface Ship {
  id: ShipType;
  name: string;
  description: string;
  speed: number;
  shield: boolean;
  lives: number;
  color: string;
}

// Tọa độ 2D (pixel) trong khung game.
export interface Position {
  x: number;
  y: number;
}

// Vật cản xuất hiện trên màn hình (thiên thạch / mảnh vỡ / mìn).
export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'asteroid' | 'debris' | 'mine';
  direction?: 'left' | 'right'; // Hướng bay ngang cho vật cản từ 2 bên hông
  passed?: boolean; // Đánh dấu đã được tính điểm né tránh hay chưa
}

// Hiệu ứng popup "+điểm" hiện ra khi né thành công vật cản.
export interface DodgePopup {
  id: string;
  x: number;
  y: number;
  createdAt: number;
}

// Thực thể xuất hiện đột ngột (sudden entity) — cảnh báo rồi mới nổ.
export interface SuddenEntity {
  id: string;
  x: number;
  y: number;
  spawnTime: number;
  isExploding: boolean;
}

// Trạng thái "bão Terra" — sự kiện thời tiết làm rung màn + tăng độ khó.
export interface TerraStorm {
  active: boolean;
  startTime: number;
  duration: number;
  intensity: number;
}

// Trạng thái tổng thể của game — chứa MỌI dữ liệu thay đổi theo thời gian.
// Được quản lý tập trung trong hook useGameState.
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
  // --- Hệ thống buff Overdrive (tăng tốc + bất tử tạm thời) ---
  overdriveActive: boolean;
  overdriveShields: number;
  overdriveStartTime: number;
  overdriveScoreRate: number; // số điểm bị trừ mỗi giây khi overdrive active
  // --- Hệ thống ending (kết thúc game theo nhánh) ---
  endingTriggered: boolean;
  flashActive: boolean;
  flashColor: 'white' | 'cyan';
}

// Liệt kê các "màn hình" của game — dùng để chuyển scene trong <Game />.
export type GameScreen = 'menu' | 'ship-select' | 'game' | 'game-over' | 'ending-scene';
