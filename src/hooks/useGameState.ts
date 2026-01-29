import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, ShipType, Obstacle, GameScreen, Ship, SuddenEntity, TerraStorm } from '@/types/game';

// Invincibility time after getting hit (in ms)
const INVINCIBILITY_DURATION = 1500;

const SHIPS: Record<ShipType, Ship> = {
  speeder: {
    id: 'speeder',
    name: 'Speeder X-1',
    description: 'Fast & agile with energy shield',
    speed: 1.5,
    shield: true,
    lives: 1,
    color: 'cyan',
  },
  tank: {
    id: 'tank',
    name: 'Titan MK-II',
    description: 'Heavy armor, survives 2 hits',
    speed: 1,
    shield: false,
    lives: 2,
    color: 'pink',
  },
};

const INITIAL_SCORE = 2500;

// Best score = lowest remaining distance (traveled the farthest)
const getBestScore = (): number => {
  const saved = localStorage.getItem('2500km-bestscore');
  // If no saved score, return initial score (worst possible)
  return saved ? parseInt(saved, 10) : INITIAL_SCORE;
};

const saveBestScore = (score: number): void => {
  localStorage.setItem('2500km-bestscore', score.toString());
};

const INITIAL_TERRA_STORM: TerraStorm = {
  active: false,
  startTime: 0,
  duration: 5000,
  intensity: 0,
};

export const useGameState = () => {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: INITIAL_SCORE,
    highScore: getBestScore(),
    distance: 0,
    selectedShip: null,
    playerPosition: { x: 50, y: 85 },
    obstacles: [],
    suddenEntities: [],
    terraStorm: INITIAL_TERRA_STORM,
    lives: 1,
    hasShield: false,
    difficulty: 1,
    gameTime: 0,
    isInvincible: false,
    lastHitTime: 0,
  });

  const gameLoopRef = useRef<number | null>(null);
  const obstacleSpawnRef = useRef<number | null>(null);
  const stormTimerRef = useRef<number | null>(null);
  const entitySpawnRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Callbacks for sound effects (set by Game component)
  const onShieldBreakRef = useRef<() => void>(() => {});
  const onCollisionRef = useRef<() => void>(() => {});
  const onExplosionRef = useRef<() => void>(() => {});
  const onStormRef = useRef<() => void>(() => {});
  const onIncomingRef = useRef<() => void>(() => {});

  const selectedShipData = gameState.selectedShip ? SHIPS[gameState.selectedShip] : null;

  const setSoundCallbacks = useCallback((callbacks: {
    onShieldBreak?: () => void;
    onCollision?: () => void;
    onExplosion?: () => void;
    onStorm?: () => void;
    onIncoming?: () => void;
  }) => {
    if (callbacks.onShieldBreak) onShieldBreakRef.current = callbacks.onShieldBreak;
    if (callbacks.onCollision) onCollisionRef.current = callbacks.onCollision;
    if (callbacks.onExplosion) onExplosionRef.current = callbacks.onExplosion;
    if (callbacks.onStorm) onStormRef.current = callbacks.onStorm;
    if (callbacks.onIncoming) onIncomingRef.current = callbacks.onIncoming;
  }, []);

  const selectShip = useCallback((shipType: ShipType) => {
    const ship = SHIPS[shipType];
    setGameState(prev => ({
      ...prev,
      selectedShip: shipType,
      lives: ship.lives,
      hasShield: ship.shield,
    }));
    setScreen('game');
  }, []);

  const startGame = useCallback(() => {
    if (!gameState.selectedShip) return;
    
    const ship = SHIPS[gameState.selectedShip];
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      score: INITIAL_SCORE,
      distance: 0,
      playerPosition: { x: 50, y: 85 },
      obstacles: [],
      suddenEntities: [],
      terraStorm: INITIAL_TERRA_STORM,
      lives: ship.lives,
      hasShield: ship.shield,
      difficulty: 1,
      gameTime: 0,
      isInvincible: false,
      lastHitTime: 0,
    }));
  }, [gameState.selectedShip]);

  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const speed = selectedShipData?.speed || 1;
    const moveAmount = 8 * speed;

    setGameState(prev => {
      let newY = prev.playerPosition.y;
      let newX = prev.playerPosition.x;

      switch (direction) {
        case 'up':
          newY = Math.max(20, prev.playerPosition.y - moveAmount);
          break;
        case 'down':
          newY = Math.min(90, prev.playerPosition.y + moveAmount);
          break;
        case 'left':
          newX = Math.max(10, prev.playerPosition.x - moveAmount);
          break;
        case 'right':
          newX = Math.min(90, prev.playerPosition.x + moveAmount);
          break;
      }

      return {
        ...prev,
        playerPosition: { x: newX, y: newY },
      };
    });
  }, [gameState.isPlaying, gameState.isPaused, selectedShipData]);

  const spawnObstacle = useCallback(() => {
    const types: Obstacle['type'][] = ['asteroid', 'debris', 'mine'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Spawn from top, random X position across the screen
    const obstacle: Obstacle = {
      id: `obs-${Date.now()}-${Math.random()}`,
      x: Math.random() * 80 + 10, // Random X position (10% to 90%)
      y: -10, // Start above the screen
      width: type === 'asteroid' ? 12 : type === 'mine' ? 8 : 10,
      height: type === 'asteroid' ? 12 : type === 'mine' ? 8 : 10,
      type,
    };

    setGameState(prev => ({
      ...prev,
      obstacles: [...prev.obstacles, obstacle],
    }));
  }, []);

  const spawnSuddenEntity = useCallback(() => {
    onIncomingRef.current();
    
    // Spawn from bottom (behind player), random X position
    const entity: SuddenEntity = {
      id: `entity-${Date.now()}-${Math.random()}`,
      x: Math.random() * 60 + 20, // Random X position
      y: 110, // Start below the screen (behind player)
      spawnTime: Date.now(),
      isExploding: false,
    };

    setGameState(prev => ({
      ...prev,
      suddenEntities: [...prev.suddenEntities, entity],
    }));
  }, []);

  const triggerTerraStorm = useCallback(() => {
    onStormRef.current();
    
    // Vibrate device if supported
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200, 100, 300]);
    }

    setGameState(prev => ({
      ...prev,
      terraStorm: {
        active: true,
        startTime: Date.now(),
        duration: 5000,
        intensity: 0.5 + Math.random() * 0.5,
      },
    }));

    // End storm after duration
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        terraStorm: { ...prev.terraStorm, active: false },
      }));
    }, 5000);
  }, []);

  const checkCollision = useCallback((playerPos: { x: number; y: number }, obstacle: Obstacle): boolean => {
    const playerWidth = 8;
    const playerHeight = 6;
    
    const playerLeft = playerPos.x;
    const playerRight = playerPos.x + playerWidth;
    const playerTop = playerPos.y - playerHeight / 2;
    const playerBottom = playerPos.y + playerHeight / 2;

    const obsLeft = obstacle.x;
    const obsRight = obstacle.x + obstacle.width;
    const obsTop = obstacle.y - obstacle.height / 2;
    const obsBottom = obstacle.y + obstacle.height / 2;

    return !(playerRight < obsLeft || playerLeft > obsRight || playerBottom < obsTop || playerTop > obsBottom);
  }, []);

  const checkEntityCollision = useCallback((playerPos: { x: number; y: number }, entity: SuddenEntity): boolean => {
    const playerWidth = 8;
    const playerHeight = 6;
    const entitySize = 10;
    
    const playerLeft = playerPos.x;
    const playerRight = playerPos.x + playerWidth;
    const playerTop = playerPos.y - playerHeight / 2;
    const playerBottom = playerPos.y + playerHeight / 2;

    const entityLeft = entity.x;
    const entityRight = entity.x + entitySize;
    const entityTop = entity.y - entitySize / 2;
    const entityBottom = entity.y + entitySize / 2;

    return !(playerRight < entityLeft || playerLeft > entityRight || playerBottom < entityTop || playerTop > entityBottom);
  }, []);

  const endGame = useCallback(() => {
    setGameState(prev => {
      // Lower score = better (traveled farther)
      const isNewBest = prev.score < prev.highScore;
      const newBestScore = isNewBest ? prev.score : prev.highScore;
      if (isNewBest) {
        saveBestScore(prev.score);
      }
      return {
        ...prev,
        isPlaying: false,
        isGameOver: true,
        highScore: newBestScore,
      };
    });
    setScreen('game-over');
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setGameState(prev => {
        // Move obstacles downward (vertical movement)
        const speed = 0.05 * prev.difficulty;
        const updatedObstacles = prev.obstacles
          .map(obs => ({ ...obs, y: obs.y + speed * deltaTime })) // Move DOWN
          .filter(obs => obs.y < 120); // Remove when off bottom of screen

        // Move sudden entities upward (from behind/below player)
        const entitySpeed = 0.1;
        const now = Date.now();
        let updatedEntities = prev.suddenEntities
          .map(entity => {
            const timeSinceSpawn = now - entity.spawnTime;
            const shouldExplode = timeSinceSpawn >= 3000;
            return {
              ...entity,
              y: entity.y - entitySpeed * deltaTime, // Move UP toward player
              isExploding: shouldExplode || entity.isExploding,
            };
          })
          .filter(entity => {
            if (entity.isExploding && entity.y < 105) {
              onExplosionRef.current();
              return false;
            }
            return entity.y > -10; // Remove when off top of screen
          });

        // Check obstacle collisions
        let hitObstacle = false;
        for (const obs of updatedObstacles) {
          if (checkCollision(prev.playerPosition, obs)) {
            hitObstacle = true;
            break;
          }
        }

        // Check entity collisions
        let hitEntity = false;
        updatedEntities = updatedEntities.filter(entity => {
          if (!entity.isExploding && checkEntityCollision(prev.playerPosition, entity)) {
            hitEntity = true;
            onExplosionRef.current();
            return false;
          }
          return true;
        });

        // Check if player is invincible (recently got hit)
        const isCurrentlyInvincible = prev.isInvincible && (Date.now() - prev.lastHitTime < INVINCIBILITY_DURATION);

        if ((hitObstacle || hitEntity) && !isCurrentlyInvincible) {
          const now = Date.now();
          
          if (prev.hasShield) {
            // Shield absorbs the hit
            onShieldBreakRef.current();
            return { 
              ...prev, 
              obstacles: updatedObstacles, 
              suddenEntities: updatedEntities,
              hasShield: false,
              isInvincible: true,
              lastHitTime: now,
            };
          } else if (prev.lives > 1) {
            // Lose a life but continue
            onCollisionRef.current();
            return { 
              ...prev, 
              obstacles: updatedObstacles, 
              suddenEntities: updatedEntities,
              lives: prev.lives - 1,
              isInvincible: true,
              lastHitTime: now,
            };
          } else {
            // No shield, no extra lives - game over will be handled by the effect
            onCollisionRef.current();
            return {
              ...prev,
              obstacles: updatedObstacles,
              suddenEntities: updatedEntities,
              lives: 0,
            };
          }
        }
        
        // Update invincibility status
        const stillInvincible = prev.isInvincible && (Date.now() - prev.lastHitTime < INVINCIBILITY_DURATION);

        // Update score and time
        const newGameTime = prev.gameTime + deltaTime / 1000;
        const timeDeduction = Math.floor(deltaTime / 1000);
        const newScore = Math.max(0, prev.score - timeDeduction);
        
        // Increase difficulty
        const newDifficulty = 1 + Math.floor(newGameTime / 30) * 0.1;

        if (newScore <= 0) {
          return prev;
        }

        return {
          ...prev,
          obstacles: updatedObstacles,
          suddenEntities: updatedEntities,
          score: newScore,
          gameTime: newGameTime,
          difficulty: newDifficulty,
          distance: prev.distance + speed * deltaTime,
          isInvincible: stillInvincible,
        };
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, checkCollision, checkEntityCollision]);

  // Obstacle spawner
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) {
      if (obstacleSpawnRef.current) {
        clearInterval(obstacleSpawnRef.current);
      }
      return;
    }

    const spawnInterval = Math.max(800, 2000 - gameState.difficulty * 200);
    
    obstacleSpawnRef.current = window.setInterval(() => {
      spawnObstacle();
    }, spawnInterval);

    return () => {
      if (obstacleSpawnRef.current) {
        clearInterval(obstacleSpawnRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, gameState.difficulty, spawnObstacle]);

  // Terra storm spawner (every 2 minutes as per BA doc, but we'll do 30s for gameplay)
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) {
      if (stormTimerRef.current) {
        clearInterval(stormTimerRef.current);
      }
      return;
    }

    // First storm after 20 seconds, then every 30 seconds
    const initialDelay = setTimeout(() => {
      triggerTerraStorm();
      
      stormTimerRef.current = window.setInterval(() => {
        triggerTerraStorm();
      }, 30000);
    }, 20000);

    return () => {
      clearTimeout(initialDelay);
      if (stormTimerRef.current) {
        clearInterval(stormTimerRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, triggerTerraStorm]);

  // Sudden entity spawner
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) {
      if (entitySpawnRef.current) {
        clearInterval(entitySpawnRef.current);
      }
      return;
    }

    // Spawn entities every 8-15 seconds randomly
    const scheduleNextEntity = () => {
      const delay = 8000 + Math.random() * 7000;
      entitySpawnRef.current = window.setTimeout(() => {
        spawnSuddenEntity();
        scheduleNextEntity();
      }, delay);
    };

    scheduleNextEntity();

    return () => {
      if (entitySpawnRef.current) {
        clearTimeout(entitySpawnRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, spawnSuddenEntity]);

  // Score countdown
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const scoreInterval = setInterval(() => {
      setGameState(prev => {
        const newScore = Math.max(0, prev.score - 1);
        if (newScore <= 0) {
          return prev;
        }
        return { ...prev, score: newScore };
      });
    }, 1000);

    return () => clearInterval(scoreInterval);
  }, [gameState.isPlaying, gameState.isPaused]);

  // Check for game over conditions (only when lives reach 0)
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isGameOver) {
      // Game over when no lives left
      if (gameState.lives <= 0) {
        endGame();
        return;
      }

      // Check win condition
      if (gameState.score <= 0) {
        endGame();
      }
    }
  }, [gameState.isPlaying, gameState.isGameOver, gameState.lives, gameState.score, endGame]);

  const goToMenu = useCallback(() => {
    setScreen('menu');
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isGameOver: false,
      selectedShip: null,
    }));
  }, []);

  const goToShipSelect = useCallback(() => {
    setScreen('ship-select');
  }, []);

  const restartGame = useCallback(() => {
    if (gameState.selectedShip) {
      setScreen('game');
      startGame();
    }
  }, [gameState.selectedShip, startGame]);

  return {
    screen,
    gameState,
    ships: SHIPS,
    selectedShipData,
    selectShip,
    startGame,
    movePlayer,
    goToMenu,
    goToShipSelect,
    restartGame,
    endGame,
    setSoundCallbacks,
  };
};
