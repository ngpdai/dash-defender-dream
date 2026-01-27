import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, ShipType, Obstacle, GameScreen, Ship } from '@/types/game';

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
const LANES = 3;
const LANE_HEIGHT = 33.33;

const getHighScore = (): number => {
  const saved = localStorage.getItem('2500km-highscore');
  return saved ? parseInt(saved, 10) : 0;
};

const saveHighScore = (score: number): void => {
  localStorage.setItem('2500km-highscore', score.toString());
};

export const useGameState = () => {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: INITIAL_SCORE,
    highScore: getHighScore(),
    distance: 0,
    selectedShip: null,
    playerPosition: { x: 10, y: 50 },
    obstacles: [],
    lives: 1,
    hasShield: false,
    difficulty: 1,
    gameTime: 0,
  });

  const gameLoopRef = useRef<number | null>(null);
  const obstacleSpawnRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const selectedShipData = gameState.selectedShip ? SHIPS[gameState.selectedShip] : null;

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
      playerPosition: { x: 10, y: 50 },
      obstacles: [],
      lives: ship.lives,
      hasShield: ship.shield,
      difficulty: 1,
      gameTime: 0,
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
          newY = Math.max(10, prev.playerPosition.y - moveAmount);
          break;
        case 'down':
          newY = Math.min(90, prev.playerPosition.y + moveAmount);
          break;
        case 'left':
          newX = Math.max(5, prev.playerPosition.x - moveAmount);
          break;
        case 'right':
          newX = Math.min(25, prev.playerPosition.x + moveAmount);
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
    
    const obstacle: Obstacle = {
      id: `obs-${Date.now()}-${Math.random()}`,
      x: 105,
      y: Math.random() * 80 + 10,
      width: type === 'asteroid' ? 12 : type === 'mine' ? 8 : 10,
      height: type === 'asteroid' ? 12 : type === 'mine' ? 8 : 10,
      type,
    };

    setGameState(prev => ({
      ...prev,
      obstacles: [...prev.obstacles, obstacle],
    }));
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

  const endGame = useCallback(() => {
    setGameState(prev => {
      const newHighScore = prev.score > prev.highScore ? prev.score : prev.highScore;
      if (prev.score > prev.highScore) {
        saveHighScore(prev.score);
      }
      return {
        ...prev,
        isPlaying: false,
        isGameOver: true,
        highScore: newHighScore,
      };
    });
    setScreen('game-over');
  }, []);

  const handleCollision = useCallback(() => {
    setGameState(prev => {
      if (prev.hasShield) {
        return { ...prev, hasShield: false };
      }
      
      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        return prev;
      }
      
      return { ...prev, lives: newLives };
    });
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
        // Move obstacles
        const speed = 0.05 * prev.difficulty;
        const updatedObstacles = prev.obstacles
          .map(obs => ({ ...obs, x: obs.x - speed * deltaTime }))
          .filter(obs => obs.x > -20);

        // Check collisions
        let hitObstacle = false;
        for (const obs of updatedObstacles) {
          if (checkCollision(prev.playerPosition, obs)) {
            hitObstacle = true;
            break;
          }
        }

        if (hitObstacle) {
          if (prev.hasShield) {
            return { ...prev, obstacles: updatedObstacles, hasShield: false };
          } else if (prev.lives > 1) {
            return { ...prev, obstacles: updatedObstacles, lives: prev.lives - 1 };
          } else {
            // Game over will be handled separately
            return prev;
          }
        }

        // Update score and time
        const newGameTime = prev.gameTime + deltaTime / 1000;
        const timeDeduction = Math.floor(deltaTime / 1000);
        const newScore = Math.max(0, prev.score - timeDeduction);
        
        // Increase difficulty
        const newDifficulty = 1 + Math.floor(newGameTime / 30) * 0.1;

        // Check win condition
        if (newScore <= 0) {
          return prev;
        }

        return {
          ...prev,
          obstacles: updatedObstacles,
          score: newScore,
          gameTime: newGameTime,
          difficulty: newDifficulty,
          distance: prev.distance + speed * deltaTime,
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
  }, [gameState.isPlaying, gameState.isPaused, checkCollision]);

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

  // Check for game over conditions
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isGameOver) {
      // Check collision game over
      for (const obs of gameState.obstacles) {
        if (checkCollision(gameState.playerPosition, obs)) {
          if (!gameState.hasShield && gameState.lives <= 1) {
            endGame();
            return;
          }
        }
      }

      // Check win condition (score reached 0 = completed journey)
      if (gameState.score <= 0) {
        endGame();
      }
    }
  }, [gameState, checkCollision, endGame]);

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
  };
};
