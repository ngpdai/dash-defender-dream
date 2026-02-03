import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, ShipType, Obstacle, GameScreen, Ship, SuddenEntity, TerraStorm, HitboxConfig } from '@/types/game';

// Debug flag - set to false for production builds
const DEBUG_MODE = import.meta.env.DEV;

// Invincibility time after getting hit (in ms)
const INVINCIBILITY_DURATION = 1500;

// Fixed lane positions (X-axis) based on a 5-lane grid system
// Lanes are evenly distributed across the playable area (15% to 85%)
const LANES = {
  positions: [17, 32, 50, 68, 83], // 5 lanes: far-left, left, center, right, far-right
  count: 5,
};

// Hitbox configurations - sizes are in PIXELS to match visual sprites exactly
// Visual sprite sizes: w-10=40px, w-8=32px, w-12=48px, h-14=56px, h-16=64px
// Hitbox = 90% of visual size for "forgiving" but fair collision
const HITBOX_CONFIG: Record<string, HitboxConfig> = {
  // Ships - hitbox is 90% of visual size
  speeder: { width: 36, height: 50 },    // Visual: w-10 h-14 (40x56px), Hitbox: 90% = 36x50px
  tank: { width: 43, height: 58 },       // Visual: w-12 h-16 (48x64px), Hitbox: 90% = 43x58px
  
  // Obstacles - hitbox is 90% of visual sprite size (rectangular box colliders)
  asteroid: { width: 36, height: 36 },   // Visual: w-10 h-10 (40x40px), Hitbox: 90% = 36x36px
  debris: { width: 29, height: 29 },     // Visual: w-8 h-8 (32x32px), Hitbox: 90% = 29x29px
  mine: { width: 29, height: 29 },       // Visual: w-8 h-8 (32x32px), Hitbox: 90% = 29x29px
  
  // Sudden entities (UFO)
  ufo: { width: 43, height: 43 },        // Visual: w-12 h-12 (48x48px), Hitbox: 90% = 43x43px
};

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
    dodgePopups: [],
    showHitboxes: false, // Only toggleable in debug mode
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
      dodgePopups: [],
      showHitboxes: DEBUG_MODE ? prev.showHitboxes : false, // Reset debug in production
    }));
  }, [gameState.selectedShip]);

  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const speed = selectedShipData?.speed || 1;
    const moveAmount = 8 * speed;
    
    // Apply wind force during Terra Storm
    const windForce = gameState.terraStorm.active ? gameState.terraStorm.intensity * 2 : 0;

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
      
      // Apply wind force (pushes player slightly during storm)
      if (prev.terraStorm.active && windForce > 0) {
        // Wind alternates direction based on time
        const windDirection = Math.sin(Date.now() / 500) > 0 ? 1 : -1;
        newX = Math.max(10, Math.min(90, newX + windDirection * windForce));
      }

      return {
        ...prev,
        playerPosition: { x: newX, y: newY },
      };
    });
  }, [gameState.isPlaying, gameState.isPaused, gameState.terraStorm, selectedShipData]);

  // Calculate obstacle density multiplier based on game time (20% increase every 60 seconds)
  const getDensityMultiplier = useCallback((gameTime: number): number => {
    return 1 + Math.floor(gameTime / 60) * 0.2;
  }, []);

  // Get random lane position (ensures obstacles spawn on fixed lanes)
  const getRandomLane = useCallback((excludeLanes: number[] = []): number => {
    const availableLanes = LANES.positions.filter(lane => 
      !excludeLanes.some(excluded => Math.abs(excluded - lane) < 10)
    );
    if (availableLanes.length === 0) {
      return LANES.positions[Math.floor(Math.random() * LANES.count)];
    }
    return availableLanes[Math.floor(Math.random() * availableLanes.length)];
  }, []);

  const spawnObstacles = useCallback(() => {
    setGameState(prev => {
      const densityMultiplier = getDensityMultiplier(prev.gameTime);
      // Increase density during Terra Storm
      const stormMultiplier = prev.terraStorm.active ? 1.5 : 1;
      const effectiveDensity = densityMultiplier * stormMultiplier;
      
      const newObstacles: Obstacle[] = [];
      
      // Base number of obstacles (1-3), increased by density
      const baseCount = Math.floor(Math.random() * 2) + 1;
      const obstacleCount = Math.min(4, Math.ceil(baseCount * effectiveDensity));
      
      // Track used lanes to prevent overlap
      const usedLanes: number[] = [];
      
      for (let i = 0; i < obstacleCount; i++) {
        const types: Obstacle['type'][] = ['asteroid', 'debris', 'mine'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Get a random lane that isn't already used
        const laneX = getRandomLane(usedLanes);
        usedLanes.push(laneX);
        
        // Stagger Y positions slightly for more dynamic patterns
        const yOffset = Math.random() * 10;
        
        const obstacle: Obstacle = {
          id: `obs-${Date.now()}-${Math.random()}-${i}`,
          x: laneX,
          y: -10 - yOffset,
          width: type === 'asteroid' ? 12 : type === 'mine' ? 8 : 10,
          height: type === 'asteroid' ? 12 : type === 'mine' ? 8 : 10,
          type,
        };
        
        newObstacles.push(obstacle);
      }
      
      // Occasionally spawn side-coming debris (from left or right)
      if (Math.random() < 0.25 * effectiveDensity) {
        const fromLeft = Math.random() > 0.5;
        // Side debris targets a random lane
        const targetLane = getRandomLane();
        const sideObstacle: Obstacle = {
          id: `obs-side-${Date.now()}-${Math.random()}`,
          x: fromLeft ? -10 : 110,
          y: 30 + Math.random() * 30, // Middle area of screen (lane-like Y positioning)
          width: 10,
          height: 10,
          type: 'debris',
          direction: fromLeft ? 'right' : 'left',
        };
        newObstacles.push(sideObstacle);
      }

      return {
        ...prev,
        obstacles: [...prev.obstacles, ...newObstacles],
      };
    });
  }, [getDensityMultiplier, getRandomLane]);

  const spawnSuddenEntity = useCallback(() => {
    onIncomingRef.current();
    
    // Spawn on a random lane (behind player)
    const laneX = getRandomLane();
    
    const entity: SuddenEntity = {
      id: `entity-${Date.now()}-${Math.random()}`,
      x: laneX,
      y: 110, // Start below the screen (behind player)
      spawnTime: Date.now(),
      isExploding: false,
    };

    setGameState(prev => ({
      ...prev,
      suddenEntities: [...prev.suddenEntities, entity],
    }));
  }, [getRandomLane]);

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

  // Reference game area size for coordinate conversion
  // Using consistent reference: 400px width, 600px height
  const GAME_AREA_REF = { width: 400, height: 600 };

  // Convert pixel hitbox to percentage based on reference game area
  const pixelToPercentX = useCallback((pixels: number): number => {
    return (pixels / GAME_AREA_REF.width) * 100;
  }, []);
  
  const pixelToPercentY = useCallback((pixels: number): number => {
    return (pixels / GAME_AREA_REF.height) * 100;
  }, []);

  // Box collision detection - both hitboxes use same coordinate system (percentages)
  const checkCollision = useCallback((playerPos: { x: number; y: number }, obstacle: Obstacle, shipType: ShipType | null): boolean => {
    // Get hitbox configs based on ship and obstacle type (in pixels)
    const shipHitbox = shipType ? HITBOX_CONFIG[shipType] : HITBOX_CONFIG.speeder;
    const obsHitbox = HITBOX_CONFIG[obstacle.type] || { width: 36, height: 36 };
    
    // Convert pixel hitboxes to percentage of game area
    const shipWidthPercent = pixelToPercentX(shipHitbox.width);
    const shipHeightPercent = pixelToPercentY(shipHitbox.height);
    const obsWidthPercent = pixelToPercentX(obsHitbox.width);
    const obsHeightPercent = pixelToPercentY(obsHitbox.height);
    
    // Player hitbox - centered on position (anchor 0.5, 0.5)
    const playerLeft = playerPos.x - shipWidthPercent / 2;
    const playerRight = playerPos.x + shipWidthPercent / 2;
    const playerTop = playerPos.y - shipHeightPercent / 2;
    const playerBottom = playerPos.y + shipHeightPercent / 2;

    // Obstacle hitbox - centered on position (anchor 0.5, 0.5)
    const obsLeft = obstacle.x - obsWidthPercent / 2;
    const obsRight = obstacle.x + obsWidthPercent / 2;
    const obsTop = obstacle.y - obsHeightPercent / 2;
    const obsBottom = obstacle.y + obsHeightPercent / 2;

    // AABB collision detection (axis-aligned bounding box)
    return !(playerRight < obsLeft || playerLeft > obsRight || playerBottom < obsTop || playerTop > obsBottom);
  }, [pixelToPercentX, pixelToPercentY]);

  const checkEntityCollision = useCallback((playerPos: { x: number; y: number }, entity: SuddenEntity, shipType: ShipType | null): boolean => {
    // Get hitbox configs (in pixels)
    const shipHitbox = shipType ? HITBOX_CONFIG[shipType] : HITBOX_CONFIG.speeder;
    const entityHitbox = HITBOX_CONFIG.ufo;
    
    // Convert pixel hitboxes to percentage of game area
    const shipWidthPercent = pixelToPercentX(shipHitbox.width);
    const shipHeightPercent = pixelToPercentY(shipHitbox.height);
    const entityWidthPercent = pixelToPercentX(entityHitbox.width);
    const entityHeightPercent = pixelToPercentY(entityHitbox.height);
    
    // Player hitbox - centered on position (anchor 0.5, 0.5)
    const playerLeft = playerPos.x - shipWidthPercent / 2;
    const playerRight = playerPos.x + shipWidthPercent / 2;
    const playerTop = playerPos.y - shipHeightPercent / 2;
    const playerBottom = playerPos.y + shipHeightPercent / 2;

    // Entity hitbox - centered on position (anchor 0.5, 0.5)
    const entityLeft = entity.x - entityWidthPercent / 2;
    const entityRight = entity.x + entityWidthPercent / 2;
    const entityTop = entity.y - entityHeightPercent / 2;
    const entityBottom = entity.y + entityHeightPercent / 2;

    // AABB collision detection
    return !(playerRight < entityLeft || playerLeft > entityRight || playerBottom < entityTop || playerTop > entityBottom);
  }, [pixelToPercentX, pixelToPercentY]);

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

  // Game loop with synchronized speed multiplier
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
        // Base speed multiplier - synchronized across all systems
        const speedMultiplier = prev.difficulty;
        // Storm increases speed by additional 40%
        const stormSpeedBoost = prev.terraStorm.active ? 1.4 : 1;
        const effectiveSpeed = speedMultiplier * stormSpeedBoost;
        
        // Move obstacles (vertical + side-coming) - speed synchronized
        const baseVerticalSpeed = 0.05;
        const baseSideSpeed = 0.03;
        const verticalSpeed = baseVerticalSpeed * effectiveSpeed;
        const sideSpeed = baseSideSpeed * effectiveSpeed;
        
        const playerY = prev.playerPosition.y;
        const playerX = prev.playerPosition.x;
        
        let dodgeCount = 0;
        const newDodgePopups: Array<{ id: string; x: number; y: number; createdAt: number }> = [];
        
        const updatedObstacles = prev.obstacles
          .map(obs => {
            let newObs = { ...obs };
            
            if (obs.direction === 'left') {
              newObs.x = obs.x - sideSpeed * deltaTime;
              // Check if passed player for horizontal obstacles
              if (!obs.passed && obs.x < playerX && obs.x > playerX - 15) {
                newObs.passed = true;
                dodgeCount++;
                newDodgePopups.push({
                  id: `dodge-${Date.now()}-${Math.random()}`,
                  x: obs.x,
                  y: obs.y,
                  createdAt: Date.now(),
                });
              }
            } else if (obs.direction === 'right') {
              newObs.x = obs.x + sideSpeed * deltaTime;
              // Check if passed player for horizontal obstacles
              if (!obs.passed && obs.x > playerX && obs.x < playerX + 15) {
                newObs.passed = true;
                dodgeCount++;
                newDodgePopups.push({
                  id: `dodge-${Date.now()}-${Math.random()}`,
                  x: obs.x,
                  y: obs.y,
                  createdAt: Date.now(),
                });
              }
            } else {
              newObs.y = obs.y + verticalSpeed * deltaTime;
              // Check if passed player for vertical obstacles (when obstacle goes past player's Y position)
              if (!obs.passed && obs.y > playerY && obs.y < playerY + 15) {
                newObs.passed = true;
                dodgeCount++;
                newDodgePopups.push({
                  id: `dodge-${Date.now()}-${Math.random()}`,
                  x: obs.x,
                  y: obs.y,
                  createdAt: Date.now(),
                });
              }
            }
            
            return newObs;
          })
          .filter(obs => {
            // Remove when off screen
            if (obs.direction === 'left') return obs.x > -15;
            if (obs.direction === 'right') return obs.x < 115;
            return obs.y < 120;
          });

        // Move sudden entities upward (from behind/below player) - speed synchronized
        const baseEntitySpeed = 0.1;
        const entitySpeed = baseEntitySpeed * effectiveSpeed;
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
          if (checkCollision(prev.playerPosition, obs, prev.selectedShip)) {
            hitObstacle = true;
            break;
          }
        }

        // Check entity collisions
        let hitEntity = false;
        updatedEntities = updatedEntities.filter(entity => {
          if (!entity.isExploding && checkEntityCollision(prev.playerPosition, entity, prev.selectedShip)) {
            hitEntity = true;
            onExplosionRef.current();
            return false;
          }
          return true;
        });

        // Check if player is invincible (recently got hit)
        const isCurrentlyInvincible = prev.isInvincible && (Date.now() - prev.lastHitTime < INVINCIBILITY_DURATION);

        if ((hitObstacle || hitEntity) && !isCurrentlyInvincible) {
          const nowHit = Date.now();
          
          if (prev.hasShield) {
            // Shield absorbs the hit
            onShieldBreakRef.current();
            return { 
              ...prev, 
              obstacles: updatedObstacles, 
              suddenEntities: updatedEntities,
              hasShield: false,
              isInvincible: true,
              lastHitTime: nowHit,
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
              lastHitTime: nowHit,
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

        // Update game time
        const newGameTime = prev.gameTime + deltaTime / 1000;
        
        // Calculate dodge score deduction (-10 per dodge)
        const dodgeDeduction = dodgeCount * 10;
        
        // Calculate new score (only dodge deductions in game loop, time deduction handled separately)
        let newScore = Math.max(0, prev.score - dodgeDeduction);
        
        // Increase difficulty (10% every 30 seconds)
        const newDifficulty = 1 + Math.floor(newGameTime / 30) * 0.1;

        // Clean up old dodge popups (remove after 1 second)
        const activePopups = [...prev.dodgePopups, ...newDodgePopups].filter(
          popup => Date.now() - popup.createdAt < 1000
        );

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
          distance: prev.distance + verticalSpeed * deltaTime,
          isInvincible: stillInvincible,
          dodgePopups: activePopups,
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

  // Obstacle spawner - spawn rate synchronized with difficulty
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) {
      if (obstacleSpawnRef.current) {
        clearInterval(obstacleSpawnRef.current);
      }
      return;
    }

    // Base interval decreases with difficulty (faster spawning)
    // Storm also increases spawn rate by 30%
    const stormRateBoost = gameState.terraStorm.active ? 0.7 : 1;
    const spawnInterval = Math.max(600, (2000 - gameState.difficulty * 200) * stormRateBoost);
    
    obstacleSpawnRef.current = window.setInterval(() => {
      spawnObstacles();
    }, spawnInterval);

    return () => {
      if (obstacleSpawnRef.current) {
        clearInterval(obstacleSpawnRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, gameState.difficulty, gameState.terraStorm.active, spawnObstacles]);

  // Terra storm spawner (first after 20 seconds, then every 30 seconds)
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) {
      if (stormTimerRef.current) {
        clearInterval(stormTimerRef.current);
      }
      return;
    }

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

  // Score countdown (-5 every 5 seconds)
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const scoreInterval = setInterval(() => {
      setGameState(prev => {
        const newScore = Math.max(0, prev.score - 5);
        if (newScore <= 0) {
          return prev;
        }
        return { ...prev, score: newScore };
      });
    }, 5000); // Every 5 seconds

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

  // Toggle hitbox debug - only available in debug mode
  const toggleHitboxDebug = useCallback(() => {
    if (!DEBUG_MODE) return; // No-op in production
    
    setGameState(prev => ({
      ...prev,
      showHitboxes: !prev.showHitboxes,
    }));
  }, []);

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
    toggleHitboxDebug: DEBUG_MODE ? toggleHitboxDebug : undefined, // Only expose in debug mode
    hitboxConfig: HITBOX_CONFIG,
    isDebugMode: DEBUG_MODE,
  };
};
