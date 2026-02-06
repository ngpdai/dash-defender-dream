import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, ShipType, Obstacle, GameScreen, Ship, SuddenEntity, TerraStorm } from '@/types/game';
import { 
  LANES, 
  checkEntityCollision as checkCollisionSystem, 
  EntityType,
  getColliderSize,
  getDebugInfo,
  COLLISION_CONFIG,
} from '@/lib/collision';

// Debug flag - temporarily enabled to show hitboxes
const DEBUG_MODE = true;

// Invincibility time after getting hit (in ms)
const INVINCIBILITY_DURATION = 1500;

// Anti-camping system constants
const CAMPING_THRESHOLD_MS = 3000; // Time in same zone to trigger anti-camp
const CORNER_ZONE_SIZE = 25; // Percentage of screen considered "corner zone"
const EDGE_ZONE_SIZE = 15; // Percentage of screen considered "edge zone"

// Corner/Edge zone definitions (percentages)
const ZONES = {
  topLeft: { xMin: 0, xMax: 30, yMin: 0, yMax: 35 },
  topRight: { xMin: 70, xMax: 100, yMin: 0, yMax: 35 },
  bottomLeft: { xMin: 0, xMax: 30, yMin: 65, yMax: 100 },
  bottomRight: { xMin: 70, xMax: 100, yMin: 65, yMax: 100 },
  leftEdge: { xMin: 0, xMax: EDGE_ZONE_SIZE, yMin: 0, yMax: 100 },
  rightEdge: { xMin: 100 - EDGE_ZONE_SIZE, xMax: 100, yMin: 0, yMax: 100 },
};

// Extended lanes including edge positions for corner coverage
const EXTENDED_LANES = [10, 17, 32, 50, 68, 83, 90] as const;

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

const INITIAL_SCORE = 25000;

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

  // Anti-camping tracking
  const playerZoneRef = useRef<string | null>(null);
  const zoneEnterTimeRef = useRef<number>(0);
  const campingIntensityRef = useRef<number>(0);

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

  // Detect which zone the player is in
  const getPlayerZone = useCallback((x: number, y: number): string | null => {
    for (const [zoneName, zone] of Object.entries(ZONES)) {
      if (x >= zone.xMin && x <= zone.xMax && y >= zone.yMin && y <= zone.yMax) {
        return zoneName;
      }
    }
    return null;
  }, []);

  // Update camping detection
  const updateCampingDetection = useCallback((x: number, y: number) => {
    const currentZone = getPlayerZone(x, y);
    const now = Date.now();
    
    if (currentZone && currentZone.includes('Corner') || 
        currentZone === 'leftEdge' || currentZone === 'rightEdge' ||
        currentZone?.includes('top') || currentZone?.includes('bottom')) {
      if (currentZone === playerZoneRef.current) {
        // Still in same zone, check duration
        const timeInZone = now - zoneEnterTimeRef.current;
        if (timeInZone > CAMPING_THRESHOLD_MS) {
          // Increase camping intensity (0 to 1)
          campingIntensityRef.current = Math.min(1, (timeInZone - CAMPING_THRESHOLD_MS) / 5000);
        }
      } else {
        // Entered new zone
        playerZoneRef.current = currentZone;
        zoneEnterTimeRef.current = now;
        campingIntensityRef.current = 0;
      }
    } else {
      // Not in a danger zone, reset
      playerZoneRef.current = null;
      campingIntensityRef.current = 0;
    }
  }, [getPlayerZone]);

  // Maximum vertical (falling) obstacles on screen at once
  const MAX_VERTICAL_OBSTACLES = 3;

  // Get lane targeting player's zone for anti-camping
  const getTargetedLane = useCallback((playerX: number, playerY: number, campingIntensity: number): number => {
    // If camping intensity is high, target player's position
    if (campingIntensity > 0.3 && Math.random() < campingIntensity) {
      // Target near player's X position
      const targetX = playerX + (Math.random() - 0.5) * 20;
      return Math.max(10, Math.min(90, targetX));
    }
    
    // If player is in corner/edge zone, prioritize lanes that cover that area
    const zone = getPlayerZone(playerX, playerY);
    if (zone) {
      // 60% chance to spawn toward player's zone
      if (Math.random() < 0.6) {
        if (zone.includes('left') || zone === 'topLeft' || zone === 'bottomLeft') {
          return EXTENDED_LANES[Math.floor(Math.random() * 3)]; // Left lanes: 10, 17, 32
        }
        if (zone.includes('right') || zone === 'topRight' || zone === 'bottomRight') {
          return EXTENDED_LANES[4 + Math.floor(Math.random() * 3)]; // Right lanes: 68, 83, 90
        }
      }
    }
    
    // Default: random extended lane
    return EXTENDED_LANES[Math.floor(Math.random() * EXTENDED_LANES.length)];
  }, [getPlayerZone]);

  const spawnObstacles = useCallback(() => {
    setGameState(prev => {
      const playerX = prev.playerPosition.x;
      const playerY = prev.playerPosition.y;
      const campingIntensity = campingIntensityRef.current;
      
      // Update camping detection
      updateCampingDetection(playerX, playerY);
      
      // Count current vertical obstacles (no direction = falling from top)
      const currentVerticalCount = prev.obstacles.filter(obs => !obs.direction).length;
      
      // Don't spawn more vertical obstacles if already at max
      if (currentVerticalCount >= MAX_VERTICAL_OBSTACLES) {
        // Still allow horizontal obstacles to spawn
        const newObstacles: Obstacle[] = [];
        
        // Get Y positions of current vertical obstacles to avoid overlap
        const verticalObstacleYs = prev.obstacles
          .filter(obs => !obs.direction)
          .map(obs => obs.y);
        
        // Spawn horizontal obstacle with higher chance to cover flight path
        const densityMultiplier = getDensityMultiplier(prev.gameTime);
        const stormMultiplier = prev.terraStorm.active ? 1.5 : 1;
        const effectiveDensity = densityMultiplier * stormMultiplier;
        
        // Increase spawn chance if camping
        const campingBonus = campingIntensity * 0.3;
        
        if (Math.random() < (0.5 + campingBonus) * effectiveDensity) {
          // Determine direction based on player position (target player's side)
          let fromLeft = Math.random() > 0.5;
          if (playerX < 30) fromLeft = true;  // Player on left, attack from left
          if (playerX > 70) fromLeft = false; // Player on right, attack from right
          
          const debrisSize = getColliderSize('debris');
          
          // Target player's Y zone if camping, otherwise random
          let targetY: number;
          if (campingIntensity > 0.5) {
            targetY = playerY + (Math.random() - 0.5) * 20;
          } else {
            targetY = 25 + Math.random() * 55; // Range 25-80 (covers more area)
          }
          targetY = Math.max(25, Math.min(85, targetY));
          
          // Avoid spawning at same Y as vertical obstacles (±15% margin)
          const isOverlapping = verticalObstacleYs.some(
            obsY => Math.abs(obsY - targetY) < 15
          );
          
          if (!isOverlapping) {
            const sideObstacle: Obstacle = {
              id: `obs-side-${Date.now()}-${Math.random()}`,
              x: fromLeft ? -10 : 110,
              y: targetY,
              width: debrisSize.width,
              height: debrisSize.height,
              type: 'debris',
              direction: fromLeft ? 'right' : 'left',
            };
            newObstacles.push(sideObstacle);
          }
        }
        
        if (newObstacles.length === 0) {
          return prev; // No changes
        }
        
        return {
          ...prev,
          obstacles: [...prev.obstacles, ...newObstacles],
        };
      }
      
      const densityMultiplier = getDensityMultiplier(prev.gameTime);
      const stormMultiplier = prev.terraStorm.active ? 1.5 : 1;
      const effectiveDensity = densityMultiplier * stormMultiplier;
      
      const newObstacles: Obstacle[] = [];
      
      // Calculate how many more vertical obstacles we can spawn
      const remainingSlots = MAX_VERTICAL_OBSTACLES - currentVerticalCount;
      
      // Base number of obstacles (1-2), limited by remaining slots
      const baseCount = Math.floor(Math.random() * 2) + 1;
      const obstacleCount = Math.min(remainingSlots, Math.ceil(baseCount * Math.min(effectiveDensity, 1.5)));
      
      // Track used lanes to prevent overlap (including existing obstacles)
      const usedLanes: number[] = prev.obstacles
        .filter(obs => !obs.direction && obs.y < 30) // Vertical obstacles near top
        .map(obs => obs.x);
      
      // Get existing horizontal obstacles' Y positions
      const horizontalObstacleYs = prev.obstacles
        .filter(obs => obs.direction)
        .map(obs => obs.y);
      
      for (let i = 0; i < obstacleCount; i++) {
        const types: Obstacle['type'][] = ['asteroid', 'debris', 'mine'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const colliderSize = getColliderSize(type as EntityType);
        
        // Get lane - use targeted lane if camping, otherwise random (including edge lanes)
        let laneX: number;
        if (campingIntensity > 0.3 && Math.random() < campingIntensity) {
          laneX = getTargetedLane(playerX, playerY, campingIntensity);
        } else {
          // Use extended lanes which include edge positions
          const availableLanes = EXTENDED_LANES.filter(
            lane => !usedLanes.some(used => Math.abs(used - lane) < 10)
          );
          laneX = availableLanes.length > 0 
            ? availableLanes[Math.floor(Math.random() * availableLanes.length)]
            : EXTENDED_LANES[Math.floor(Math.random() * EXTENDED_LANES.length)];
        }
        usedLanes.push(laneX);
        
        // Stagger Y positions slightly for more dynamic patterns
        const yOffset = Math.random() * 8;
        
        const obstacle: Obstacle = {
          id: `obs-${Date.now()}-${Math.random()}-${i}`,
          x: laneX,
          y: -10 - yOffset,
          width: colliderSize.width,
          height: colliderSize.height,
          type,
        };
        
        newObstacles.push(obstacle);
      }
      
      // Spawn horizontal obstacles more frequently to cover flight path
      // Higher chance (50%) to ensure player can't stay in one lane safely
      const campingBonus = campingIntensity * 0.3;
      if (Math.random() < (0.5 + campingBonus) * effectiveDensity) {
        // Determine direction based on player position
        let fromLeft = Math.random() > 0.5;
        if (playerX < 30) fromLeft = true;
        if (playerX > 70) fromLeft = false;
        
        const debrisSize = getColliderSize('debris');
        
        // Target player's Y zone if camping
        let targetY: number;
        if (campingIntensity > 0.5) {
          targetY = playerY + (Math.random() - 0.5) * 15;
        } else {
          targetY = 25 + Math.random() * 55; // Range 25-80
        }
        targetY = Math.max(25, Math.min(85, targetY));
        
        // Avoid spawning at same Y as other horizontal obstacles
        const isOverlappingHorizontal = horizontalObstacleYs.some(
          obsY => Math.abs(obsY - targetY) < 20
        );
        
        // Avoid spawning at same Y as new vertical obstacles
        const newVerticalYs = newObstacles.map(obs => obs.y + 50);
        const isOverlappingVertical = newVerticalYs.some(
          obsY => Math.abs(obsY - targetY) < 15
        );
        
        if (!isOverlappingHorizontal && !isOverlappingVertical) {
          const sideObstacle: Obstacle = {
            id: `obs-side-${Date.now()}-${Math.random()}`,
            x: fromLeft ? -10 : 110,
            y: targetY,
            width: debrisSize.width,
            height: debrisSize.height,
            type: 'debris',
            direction: fromLeft ? 'right' : 'left',
          };
          newObstacles.push(sideObstacle);
        }
      }

      return {
        ...prev,
        obstacles: [...prev.obstacles, ...newObstacles],
      };
    });
  }, [getDensityMultiplier, getPlayerZone, getTargetedLane, updateCampingDetection]);

  const spawnSuddenEntity = useCallback(() => {
    onIncomingRef.current();
    
    // Spawn on a random lane (behind player) - using collision system's LANES
    const laneX = LANES.getRandom();
    
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

  // Collision detection using the unified collision system
  // Uses CENTER-CENTER anchor and same coordinate system as rendering
  const checkCollision = useCallback((
    playerPos: { x: number; y: number }, 
    obstacle: Obstacle, 
    shipType: ShipType | null
  ): boolean => {
    // Use the collision system's unified function
    const playerType: EntityType = shipType || 'speeder';
    const obstacleType: EntityType = obstacle.type;
    
    return checkCollisionSystem(playerPos, playerType, obstacle, obstacleType);
  }, []);

  const checkSuddenEntityCollision = useCallback((
    playerPos: { x: number; y: number }, 
    entity: SuddenEntity, 
    shipType: ShipType | null
  ): boolean => {
    // Use the collision system's unified function
    const playerType: EntityType = shipType || 'speeder';
    
    return checkCollisionSystem(playerPos, playerType, entity, 'ufo');
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
          if (!entity.isExploding && checkSuddenEntityCollision(prev.playerPosition, entity, prev.selectedShip)) {
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
  }, [gameState.isPlaying, gameState.isPaused, checkCollision, checkSuddenEntityCollision]);

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
    toggleHitboxDebug: DEBUG_MODE ? toggleHitboxDebug : undefined,
    // Export collision system utilities for debug visualization
    getDebugInfo,
    collisionConfig: COLLISION_CONFIG,
    isDebugMode: DEBUG_MODE,
  };
};
