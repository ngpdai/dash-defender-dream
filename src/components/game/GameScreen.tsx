import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Shield, Gauge, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { GameState, Ship, Obstacle, SuddenEntity, DodgePopup, PowerUp, PowerUpPopup } from '@/types/game';
import EasterEggModal from './EasterEggModal';
import { AsteroidVisual, UFOVisual, TitanShip, SpeederShip } from './GameVisuals';
import { 
  EntityType, 
  CollisionDebugInfo, 
  getDebugInfo as getDebugInfoFn,
  COLLISION_CONFIG,
} from '@/lib/collision';

// Debug mode flag - temporarily enabled to show hitboxes
const DEBUG_MODE = true;

interface GameScreenProps {
  gameState: GameState;
  shipData: Ship | null;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onStart: () => void;
  onMoveSound?: () => void;
  onToggleHitboxDebug?: () => void;
  getDebugInfo?: (x: number, y: number, entityType: EntityType) => CollisionDebugInfo;
  collisionConfig?: typeof COLLISION_CONFIG;
  isDebugMode?: boolean;
  onSecretVictory?: () => void;
  onFlashComplete?: () => void;
}

/**
 * Hitbox Debug Overlay
 * Shows both visual sprite bounds and collision bounds
 * Uses CENTER-CENTER anchor (same as collision system)
 */
const HitboxOverlay = ({ 
  debugInfo,
  color = 'red',
}: { 
  debugInfo: CollisionDebugInfo;
  color?: string;
}) => (
  <>
    {/* Collider bounds (what the game uses for collision) */}
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${debugInfo.collider.left}%`,
        top: `${debugInfo.collider.top}%`,
        width: `${debugInfo.collider.right - debugInfo.collider.left}%`,
        height: `${debugInfo.collider.bottom - debugInfo.collider.top}%`,
        border: `2px solid ${color}`,
        backgroundColor: `${color}20`,
        borderRadius: '2px',
        zIndex: 100,
      }}
    />
    
    {/* Center marker - cyan cross at entity center */}
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${debugInfo.center.x}%`,
        top: `${debugInfo.center.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 101,
      }}
    >
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 bg-cyan-400"
        style={{ boxShadow: '0 0 4px cyan' }}
      />
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 bg-cyan-400"
        style={{ boxShadow: '0 0 4px cyan' }}
      />
    </div>
  </>
);

const ObstacleComponent = ({ obstacle, showHitbox, getDebugInfo }: { 
  obstacle: Obstacle; 
  showHitbox?: boolean;
  getDebugInfo?: (x: number, y: number, entityType: EntityType) => CollisionDebugInfo;
}) => {
  const debugInfo = showHitbox && getDebugInfo 
    ? getDebugInfo(obstacle.x, obstacle.y, obstacle.type as EntityType) 
    : null;
  
  return (
    <>
      {/* Wrapper positioned at obstacle center, then inner div for centering */}
      <div
        className="absolute"
        style={{
          left: `${obstacle.x}%`,
          top: `${obstacle.y}%`,
        }}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="transform -translate-x-1/2 -translate-y-1/2"
        >
          <AsteroidVisual type={obstacle.type} />
        </motion.div>
      </div>
      {showHitbox && debugInfo && (
        <HitboxOverlay 
          debugInfo={debugInfo}
          color="orange"
        />
      )}
    </>
  );
};

const SuddenEntityComponent = ({ entity, showHitbox, getDebugInfo }: { 
  entity: SuddenEntity;
  showHitbox?: boolean;
  getDebugInfo?: (x: number, y: number, entityType: EntityType) => CollisionDebugInfo;
}) => {
  const timeSinceSpawn = Date.now() - entity.spawnTime;
  const isWarning = timeSinceSpawn > 2000; // Flash warning in last second
  const debugInfo = showHitbox && getDebugInfo
    ? getDebugInfo(entity.x, entity.y, 'ufo')
    : null;

  // Don't render if exploding (removed explosion visual)
  if (entity.isExploding) return null;

  return (
    <>
      {/* Wrapper positioned at entity center, then inner div for centering */}
      <div
        className="absolute"
        style={{
          left: `${entity.x}%`,
          top: `${entity.y}%`,
        }}
      >
        <motion.div
          initial={{ y: 50, scale: 0.5, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`transform -translate-x-1/2 -translate-y-1/2 ${isWarning ? 'animate-pulse' : ''}`}
          style={{
            filter: isWarning ? 'drop-shadow(0 0 10px hsl(var(--destructive)))' : 'none',
          }}
        >
          <UFOVisual isExploding={entity.isExploding} />
        </motion.div>
      </div>
      {showHitbox && debugInfo && (
        <HitboxOverlay 
          debugInfo={debugInfo}
          color="purple"
        />
      )}
    </>
  );
};

const DodgePopupComponent = ({ popup }: { popup: DodgePopup }) => {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -30, scale: 1.2 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="absolute pointer-events-none z-30"
      style={{
        left: `${popup.x}%`,
        top: `${popup.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <span className="font-orbitron text-lg font-bold text-primary text-glow-cyan">
        -10
      </span>
    </motion.div>
  );
};

// ========================================
// POWER-UP VISUAL COMPONENT
// ========================================
// Vật phẩm hồi shield/HP - 3 lớp: Glow cyan + Viền vàng + Tâm đỏ hồng
// Có hiệu ứng lơ lửng (floating) và glow pulsing
const PowerUpComponent = ({ powerUp }: { powerUp: PowerUp }) => {
  return (
    <div
      className="absolute"
      style={{
        left: `${powerUp.x}%`,
        top: `${powerUp.y}%`,
      }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, y: [0, -5, 0, 5, 0] }}
        transition={{
          scale: { duration: 0.3 },
          opacity: { duration: 0.3 },
          y: { duration: 2, repeat: Infinity, ease: 'easeInOut' }, // Hiệu ứng lơ lửng
        }}
        className="transform -translate-x-1/2 -translate-y-1/2 relative"
        style={{ width: 40, height: 40 }}
      >
        {/* Lớp 1 (ngoài cùng): Glow effect màu cyan - pulsing */}
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,255,255,0.6) 0%, transparent 70%)',
            filter: 'blur(8px)',
            transform: 'scale(1.8)',
          }}
        />
        {/* Lớp 2 (giữa): Vòng tròn viền màu vàng gold */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '3px solid #FFD700',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
          }}
        />
        {/* Lớp 3 (trong): Tâm màu đỏ/hồng */}
        <div
          className="absolute rounded-full"
          style={{
            width: 24,
            height: 24,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, #FF0066 0%, #CC0052 100%)',
            boxShadow: '0 0 8px rgba(255, 0, 102, 0.6)',
          }}
        />
      </motion.div>
    </div>
  );
};

// ========================================
// POWER-UP FLOATING TEXT COMPONENT
// ========================================
// Text bay lên từ vị trí tàu khi thu thập power-up
// Màu xanh lá = hồi thành công, cam = đã full
const PowerUpPopupComponent = ({ popup }: { popup: PowerUpPopup }) => {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -40 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className="absolute pointer-events-none z-30"
      style={{
        left: `${popup.x}%`,
        top: `${popup.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <span
        className="font-orbitron text-sm font-bold whitespace-nowrap"
        style={{
          color: popup.color === 'green' ? '#00FF00' : '#FFA500',
          textShadow: popup.color === 'green'
            ? '0 0 10px rgba(0,255,0,0.8)'
            : '0 0 10px rgba(255,165,0,0.8)',
        }}
      >
        {popup.text}
      </span>
    </motion.div>
  );
};

const TerraStormOverlay = ({ storm }: { storm: GameState['terraStorm'] }) => {
  if (!storm.active) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none z-20"
    >
      {/* Warping space effect */}
      <div 
        className="absolute inset-0 animate-storm-warp"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.2) 0%, transparent 60%)
          `,
        }}
      />
      
      {/* Scanlines */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.1) 2px,
            rgba(0, 255, 255, 0.1) 4px
          )`,
          animation: 'scanlines 0.1s linear infinite',
        }}
      />

      {/* Chromatic aberration simulation */}
      <div 
        className="absolute inset-0 mix-blend-screen animate-glitch"
        style={{
          background: 'linear-gradient(90deg, rgba(255,0,0,0.1) 0%, transparent 33%, transparent 66%, rgba(0,0,255,0.1) 100%)',
        }}
      />

      {/* Warning indicator */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-destructive/80 rounded-lg border border-destructive"
      >
        <AlertTriangle className="w-5 h-5 text-destructive-foreground animate-pulse" />
        <span className="font-orbitron text-sm text-destructive-foreground">TERRA STORM</span>
      </motion.div>
    </motion.div>
  );
};

const RadarPulse = ({ x, y, isPlaying }: { x: number; y: number; isPlaying: boolean }) => {
  const [pulses, setPulses] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      setPulses([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Spawn first pulse after 2s, then every 7s
    const timeout = setTimeout(() => {
      setPulses(p => [...p, Date.now()]);
      intervalRef.current = setInterval(() => {
        setPulses(p => [...p.filter(t => Date.now() - t < 2000), Date.now()]);
      }, 7000);
    }, 2000);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  // Clean expired pulses
  useEffect(() => {
    if (pulses.length === 0) return;
    const timer = setTimeout(() => {
      setPulses(p => p.filter(t => Date.now() - t < 2000));
    }, 2100);
    return () => clearTimeout(timer);
  }, [pulses]);

  return (
    <>
      {pulses.map(id => (
        <motion.div
          key={id}
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ width: '250vmax', height: '250vmax', opacity: 0 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            border: '2px solid rgba(0, 255, 200, 0.6)',
            boxShadow: '0 0 12px rgba(0, 255, 200, 0.4), inset 0 0 12px rgba(0, 255, 200, 0.1)',
            zIndex: 5,
          }}
        />
      ))}
    </>
  );
};

const GameScreenComponent = ({ gameState, shipData, onMove, onStart, onMoveSound, onToggleHitboxDebug, getDebugInfo, collisionConfig, isDebugMode = false, onSecretVictory, onFlashComplete }: GameScreenProps) => {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [showStartPrompt, setShowStartPrompt] = useState(true);
  
  // Only show debug features if both debug mode is enabled AND we're in dev environment
  const canShowDebug = isDebugMode && DEBUG_MODE;

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.isPlaying) {
        if (e.key === ' ' || e.key === 'Enter') {
          onStart();
          setShowStartPrompt(false);
        }
        return;
      }

      let moved = false;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          onMove('up');
          moved = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          onMove('down');
          moved = true;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          onMove('left');
          moved = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          onMove('right');
          moved = true;
          break;
      }
      if (moved && onMoveSound) {
        onMoveSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isPlaying, onMove, onStart, onMoveSound]);

  // Touch controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      if (!gameState.isPlaying) {
        onStart();
        setShowStartPrompt(false);
        touchStartRef.current = null;
        return;
      }

      const minSwipe = 30;
      let moved = false;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > minSwipe) {
          onMove('right');
          moved = true;
        } else if (deltaX < -minSwipe) {
          onMove('left');
          moved = true;
        }
      } else {
        if (deltaY > minSwipe) {
          onMove('down');
          moved = true;
        } else if (deltaY < -minSwipe) {
          onMove('up');
          moved = true;
        }
      }

      if (moved && onMoveSound) {
        onMoveSound();
      }

      touchStartRef.current = null;
    },
    [gameState.isPlaying, onMove, onStart, onMoveSound]
  );

  return (
    <div 
      className={`flex flex-col h-screen relative z-10 ${gameState.terraStorm.active ? 'animate-shake' : ''}`}
    >
      {/* HUD */}
      <div className="flex justify-between items-center p-4 bg-space-dark/80 border-b border-primary/30">
        {/* Score */}
        <div className="flex items-center gap-4">
          <div className={`font-orbitron text-2xl md:text-3xl font-bold ${gameState.overdriveActive ? 'text-secondary text-glow-pink' : 'text-primary text-glow-cyan'}`}>
            {gameState.score.toLocaleString()}
            <span className="text-sm text-muted-foreground ml-2">KM</span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4">
          {/* Overdrive Shield Counter */}
          {gameState.overdriveActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-3 py-1 bg-primary/20 rounded-full border border-primary/50 box-glow-cyan"
            >
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-rajdhani text-sm font-bold text-primary">🛡️ {gameState.overdriveShields}</span>
            </motion.div>
          )}
          {/* Shield */}
          {!gameState.overdriveActive && gameState.hasShield && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-3 py-1 bg-primary/20 rounded-full border border-primary/50"
            >
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-rajdhani text-sm text-primary">SHIELD</span>
            </motion.div>
          )}

          {/* Lives */}
          <div className="flex items-center gap-1">
            {[...Array(gameState.lives)].map((_, i) => (
              <Heart
                key={i}
                className="w-5 h-5 text-secondary fill-secondary"
              />
            ))}
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Gauge className="w-4 h-4" />
            <span className="font-rajdhani text-sm">
              {gameState.difficulty.toFixed(1)}x
            </span>
          </div>
          
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className="flex-1 relative overflow-hidden bg-gradient-to-r from-space-dark via-space-medium to-space-dark"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Easter Egg - only for Speeder X-1 */}
        {shipData?.id === 'speeder' && onSecretVictory && gameState.isPlaying && (
          <EasterEggModal onSecretUnlocked={onSecretVictory} />
        )}

        {/* Terra Storm Overlay */}
        <AnimatePresence>
          {gameState.terraStorm.active && (
            <TerraStormOverlay storm={gameState.terraStorm} />
          )}
        </AnimatePresence>

        {/* Overdrive Mode Overlay */}
        <AnimatePresence>
          {gameState.overdriveActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-20"
            >
              <div 
                className="absolute inset-0"
                style={{
                  boxShadow: 'inset 0 0 80px hsl(180 100% 50% / 0.3), inset 0 0 40px hsl(180 100% 50% / 0.2)',
                }}
              />
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`speed-${i}`}
                  initial={{ y: '-10%', opacity: 0 }}
                  animate={{ y: '110%', opacity: [0, 0.6, 0] }}
                  transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.15, ease: 'linear' }}
                  className="absolute w-px bg-primary/60"
                  style={{ left: `${10 + i * 12}%`, height: '20%' }}
                />
              ))}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-2 bg-primary/80 rounded-lg border border-primary box-glow-cyan"
              >
                <motion.span
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="font-orbitron text-sm font-bold text-primary-foreground"
                >
                  ⚡ OVERDRIVE MODE ⚡
                </motion.span>
              </motion.div>
              {gameState.overdriveScoreRate > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-32 left-1/2 -translate-x-1/2 px-4 py-1 bg-space-dark/80 rounded border border-primary/30"
                >
                  <span className="font-rajdhani text-sm text-primary">
                    TIME TO DESTINATION: {Math.max(0, Math.ceil(gameState.score / gameState.overdriveScoreRate))}s
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid lines - vertical scrolling effect */}
        <div className="absolute inset-0 opacity-10">
          {/* Vertical lines (static) */}
          {[...Array(10)].map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute h-full w-px bg-primary"
              style={{ left: `${(i + 1) * 10}%` }}
            />
          ))}
          {/* Horizontal lines (moving down to create falling effect) */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`h-${i}`}
              initial={{ y: '-100%' }}
              animate={{ y: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.1,
              }}
              className="absolute w-full h-px bg-primary/50"
              style={{ top: `${(i + 1) * 5}%` }}
            />
          ))}
        </div>

        {/* Radar Pulse Effect - behind ship */}
        <RadarPulse x={gameState.playerPosition.x} y={gameState.playerPosition.y} isPlaying={gameState.isPlaying} />

        {/* Player Ship */}
        <motion.div
          animate={{
            left: `${gameState.playerPosition.x}%`,
            top: `${gameState.playerPosition.y}%`,
            opacity: gameState.isInvincible ? [1, 0.3, 1] : 1,
          }}
          transition={{ 
            left: { type: 'spring', stiffness: 300, damping: 20 },
            top: { type: 'spring', stiffness: 300, damping: 20 },
            opacity: gameState.isInvincible ? { duration: 0.2, repeat: Infinity } : { duration: 0 },
          }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ zIndex: 10 }}
        >
          <div className="relative">
            {/* Shield effect */}
            {gameState.hasShield && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 -m-4 rounded-full border-2 border-primary bg-primary/10"
              />
            )}
            {/* Ship - custom visual component */}
            {shipData?.id === 'speeder' ? (
              <SpeederShip isInvincible={gameState.isInvincible} overdriveActive={gameState.overdriveActive} godMode={canShowDebug && gameState.showHitboxes} />
            ) : (
              <TitanShip isInvincible={gameState.isInvincible} godMode={canShowDebug && gameState.showHitboxes} />
            )}
          </div>
        </motion.div>
        
        {/* Player Ship Hitbox Debug - Only in debug mode */}
        {canShowDebug && gameState.showHitboxes && getDebugInfo && shipData && (
          <HitboxOverlay 
            debugInfo={getDebugInfo(gameState.playerPosition.x, gameState.playerPosition.y, shipData.id as EntityType)}
            color="lime"
          />
        )}

        {/* Obstacles */}
        {gameState.obstacles.map(obstacle => (
          <ObstacleComponent 
            key={obstacle.id} 
            obstacle={obstacle} 
            showHitbox={canShowDebug && gameState.showHitboxes}
            getDebugInfo={getDebugInfo}
          />
        ))}

        {/* Sudden Entities */}
        {gameState.suddenEntities.map(entity => (
          <SuddenEntityComponent 
            key={entity.id} 
            entity={entity}
            showHitbox={canShowDebug && gameState.showHitboxes}
            getDebugInfo={getDebugInfo}
          />
        ))}

        {/* Dodge Popups */}
        <AnimatePresence>
          {gameState.dodgePopups.map(popup => (
            <DodgePopupComponent key={popup.id} popup={popup} />
          ))}
        </AnimatePresence>

        {/* ========================================
            POWER-UPS - Vật phẩm hồi shield/HP
            ======================================== */}
        <AnimatePresence>
          {gameState.powerUps.map(powerUp => (
            <PowerUpComponent key={powerUp.id} powerUp={powerUp} />
          ))}
        </AnimatePresence>

        {/* ========================================
            POWER-UP FLOATING TEXT - Phản hồi thu thập
            ======================================== */}
        <AnimatePresence>
          {gameState.powerUpPopups.map(popup => (
            <PowerUpPopupComponent key={popup.id} popup={popup} />
          ))}
        </AnimatePresence>

        {/* Flash Effect Overlay */}
        <AnimatePresence>
          {gameState.flashActive && (
            <motion.div
              key="flash-overlay"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0, 0.5, 1.5, 3] }}
              transition={{ duration: 1, ease: 'easeOut', times: [0, 0.2, 0.6, 1] }}
              onAnimationComplete={() => onFlashComplete?.()}
              className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
            >
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: gameState.flashColor === 'cyan'
                    ? 'radial-gradient(circle, rgba(0,255,255,1) 0%, rgba(0,255,255,0.6) 30%, rgba(0,136,255,0.3) 60%, transparent 80%)'
                    : 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.3) 60%, transparent 80%)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Prompt */}
        {showStartPrompt && !gameState.isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-space-dark/50"
          >
            <div className="text-center">
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="font-orbitron text-xl text-primary text-glow-cyan"
              >
                PRESS SPACE OR TAP TO START
              </motion.p>
              <p className="font-rajdhani text-muted-foreground mt-2">
                Avoid obstacles. Reach 0 KM to win!
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Mobile Controls Hint */}
      <div className="p-2 bg-space-dark/80 border-t border-primary/30 text-center md:hidden">
        <p className="font-rajdhani text-xs text-muted-foreground">
          Swipe to move
        </p>
      </div>
    </div>
  );
};

export default GameScreenComponent;
