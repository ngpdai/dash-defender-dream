import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Shield, Gauge, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { GameState, Ship, Obstacle, SuddenEntity, DodgePopup, HitboxConfig } from '@/types/game';
import { AsteroidVisual, UFOVisual, TitanShip, SpeederShip } from './GameVisuals';

interface GameScreenProps {
  gameState: GameState;
  shipData: Ship | null;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onStart: () => void;
  onMoveSound?: () => void;
  onToggleHitboxDebug?: () => void;
  hitboxConfig?: Record<string, HitboxConfig>;
}

// Hitbox debug overlay component - now uses PIXELS for accurate sizing
const HitboxOverlay = ({ 
  x, y, width, height, color = 'red', showCenterMarker = true 
}: { x: number; y: number; width: number; height: number; color?: string; showCenterMarker?: boolean }) => (
  <>
    {/* Hitbox rectangle - pixel-based sizing */}
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}px`,
        height: `${height}px`,
        transform: 'translate(-50%, -50%)', // Center on position
        border: `2px solid ${color}`,
        backgroundColor: `${color}20`,
        borderRadius: '4px',
        zIndex: 100,
      }}
    >
      {/* Center marker for hitbox (yellow +) */}
      {showCenterMarker && (
        <>
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 bg-yellow-400"
            style={{ boxShadow: '0 0 4px yellow' }}
          />
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 bg-yellow-400"
            style={{ boxShadow: '0 0 4px yellow' }}
          />
        </>
      )}
    </div>
    
    {/* Sprite center marker (cyan +) - should overlap with yellow if aligned correctly */}
    {showCenterMarker && (
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 101,
        }}
      >
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-0.5 bg-cyan-400"
          style={{ boxShadow: '0 0 6px cyan' }}
        />
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-400"
          style={{ boxShadow: '0 0 6px cyan' }}
        />
      </div>
    )}
  </>
);

const ObstacleComponent = ({ obstacle, showHitbox, hitboxConfig }: { 
  obstacle: Obstacle; 
  showHitbox?: boolean;
  hitboxConfig?: Record<string, HitboxConfig>;
}) => {
  const hitbox = hitboxConfig?.[obstacle.type];
  
  return (
    <>
      <motion.div
        initial={{ y: '-50px', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute"
        style={{
          left: `${obstacle.x}%`,
          top: `${obstacle.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <AsteroidVisual type={obstacle.type} />
      </motion.div>
      {showHitbox && hitbox && (
        <HitboxOverlay 
          x={obstacle.x} 
          y={obstacle.y} 
          width={hitbox.width} 
          height={hitbox.height}
          color="orange"
        />
      )}
    </>
  );
};

const SuddenEntityComponent = ({ entity, showHitbox, hitboxConfig }: { 
  entity: SuddenEntity;
  showHitbox?: boolean;
  hitboxConfig?: Record<string, HitboxConfig>;
}) => {
  const timeSinceSpawn = Date.now() - entity.spawnTime;
  const isWarning = timeSinceSpawn > 2000; // Flash warning in last second
  const hitbox = hitboxConfig?.ufo;

  // Don't render if exploding (removed explosion visual)
  if (entity.isExploding) return null;

  return (
    <>
      <motion.div
        initial={{ y: '50px', scale: 0.5, opacity: 0 }}
        animate={{ 
          y: 0, 
          scale: 1, 
          opacity: 1,
        }}
        transition={{ duration: 0.2 }}
        className={`absolute ${isWarning ? 'animate-pulse' : ''}`}
        style={{
          left: `${entity.x}%`,
          top: `${entity.y}%`,
          transform: 'translate(-50%, -50%)',
          filter: isWarning ? 'drop-shadow(0 0 10px hsl(var(--destructive)))' : 'none',
        }}
      >
        <UFOVisual isExploding={entity.isExploding} />
      </motion.div>
      {showHitbox && hitbox && (
        <HitboxOverlay 
          x={entity.x} 
          y={entity.y} 
          width={hitbox.width} 
          height={hitbox.height}
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

const GameScreen = ({ gameState, shipData, onMove, onStart, onMoveSound, onToggleHitboxDebug, hitboxConfig }: GameScreenProps) => {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [showStartPrompt, setShowStartPrompt] = useState(true);

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
          <div className="font-orbitron text-2xl md:text-3xl font-bold text-primary text-glow-cyan">
            {gameState.score.toLocaleString()}
            <span className="text-sm text-muted-foreground ml-2">KM</span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4">
          {/* Shield */}
          {gameState.hasShield && (
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
          
          {/* Debug Hitbox Toggle */}
          {onToggleHitboxDebug && (
            <button
              onClick={onToggleHitboxDebug}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                gameState.showHitboxes 
                  ? 'bg-destructive/20 border-destructive/50 text-destructive' 
                  : 'bg-muted/20 border-muted/30 text-muted-foreground'
              }`}
              title="Toggle hitbox debug view"
            >
              {gameState.showHitboxes ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className="flex-1 relative overflow-hidden bg-gradient-to-r from-space-dark via-space-medium to-space-dark"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Terra Storm Overlay */}
        <AnimatePresence>
          {gameState.terraStorm.active && (
            <TerraStormOverlay storm={gameState.terraStorm} />
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
              <SpeederShip isInvincible={gameState.isInvincible} />
            ) : (
              <TitanShip isInvincible={gameState.isInvincible} />
            )}
          </div>
        </motion.div>
        
        {/* Player Ship Hitbox Debug */}
        {gameState.showHitboxes && hitboxConfig && shipData && (
          <HitboxOverlay 
            x={gameState.playerPosition.x} 
            y={gameState.playerPosition.y} 
            width={hitboxConfig[shipData.id]?.width || 36} 
            height={hitboxConfig[shipData.id]?.height || 50}
            color="lime"
          />
        )}

        {/* Obstacles */}
        {gameState.obstacles.map(obstacle => (
          <ObstacleComponent 
            key={obstacle.id} 
            obstacle={obstacle} 
            showHitbox={gameState.showHitboxes}
            hitboxConfig={hitboxConfig}
          />
        ))}

        {/* Sudden Entities */}
        {gameState.suddenEntities.map(entity => (
          <SuddenEntityComponent 
            key={entity.id} 
            entity={entity}
            showHitbox={gameState.showHitboxes}
            hitboxConfig={hitboxConfig}
          />
        ))}

        {/* Dodge Popups */}
        <AnimatePresence>
          {gameState.dodgePopups.map(popup => (
            <DodgePopupComponent key={popup.id} popup={popup} />
          ))}
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

export default GameScreen;
