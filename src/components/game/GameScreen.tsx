import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Shield, Gauge, AlertTriangle } from 'lucide-react';
import { GameState, Ship, Obstacle, SuddenEntity } from '@/types/game';

interface GameScreenProps {
  gameState: GameState;
  shipData: Ship | null;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onStart: () => void;
  onMoveSound?: () => void;
}

const ObstacleComponent = ({ obstacle }: { obstacle: Obstacle }) => {
  const getObstacleEmoji = () => {
    switch (obstacle.type) {
      case 'asteroid':
        return '☄️';
      case 'debris':
        return '🪨';
      case 'mine':
        return '💥';
      default:
        return '🌑';
    }
  };

  return (
    <motion.div
      initial={{ y: '-50px', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute text-3xl"
      style={{
        left: `${obstacle.x}%`,
        top: `${obstacle.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {getObstacleEmoji()}
    </motion.div>
  );
};

const SuddenEntityComponent = ({ entity }: { entity: SuddenEntity }) => {
  const timeSinceSpawn = Date.now() - entity.spawnTime;
  const isWarning = timeSinceSpawn > 2000; // Flash warning in last second

  return (
    <motion.div
      initial={{ y: '50px', scale: 0.5, opacity: 0 }}
      animate={{ 
        y: 0, 
        scale: entity.isExploding ? [1, 2, 0] : 1, 
        opacity: entity.isExploding ? [1, 1, 0] : 1,
        rotate: entity.isExploding ? [0, 180, 360] : 0,
      }}
      transition={{ 
        duration: entity.isExploding ? 0.3 : 0.2,
      }}
      className={`absolute text-3xl ${isWarning && !entity.isExploding ? 'animate-pulse' : ''}`}
      style={{
        left: `${entity.x}%`,
        top: `${entity.y}%`,
        transform: 'translate(-50%, -50%) rotate(180deg)',
        filter: isWarning && !entity.isExploding ? 'drop-shadow(0 0 10px #ff0000)' : 'none',
      }}
    >
      {entity.isExploding ? '💥' : '🛸'}
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

const GameScreen = ({ gameState, shipData, onMove, onStart, onMoveSound }: GameScreenProps) => {
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
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
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
            {/* Ship - rotated to point upward */}
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-4xl md:text-5xl"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {shipData?.id === 'speeder' ? '🚀' : '🛸'}
            </motion.div>
            {/* Engine glow - now at bottom */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-2 w-2 h-4 rounded-full blur-sm ${
                shipData?.color === 'cyan' ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          </div>
        </motion.div>

        {/* Obstacles */}
        {gameState.obstacles.map(obstacle => (
          <ObstacleComponent key={obstacle.id} obstacle={obstacle} />
        ))}

        {/* Sudden Entities */}
        {gameState.suddenEntities.map(entity => (
          <SuddenEntityComponent key={entity.id} entity={entity} />
        ))}

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
