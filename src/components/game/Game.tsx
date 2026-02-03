import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameState } from '@/hooks/useGameState';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import StarField from './StarField';
import MenuScreen from './MenuScreen';
import ShipSelectScreen from './ShipSelectScreen';
import GameScreen from './GameScreen';
import GameOverScreen from './GameOverScreen';

const Game = () => {
  const {
    screen,
    gameState,
    ships,
    selectedShipData,
    selectShip,
    startGame,
    movePlayer,
    goToMenu,
    goToShipSelect,
    restartGame,
    setSoundCallbacks,
    toggleHitboxDebug,
    hitboxConfig,
    isDebugMode,
  } = useGameState();

  const {
    playMoveSound,
    playCollisionSound,
    playShieldBreakSound,
    playStormSound,
    playExplosionSound,
    playIncomingSound,
    playStartSound,
    playGameOverSound,
    playVictorySound,
  } = useSoundEffects();

  // Set up sound callbacks
  useEffect(() => {
    setSoundCallbacks({
      onShieldBreak: playShieldBreakSound,
      onCollision: playCollisionSound,
      onExplosion: playExplosionSound,
      onStorm: playStormSound,
      onIncoming: playIncomingSound,
    });
  }, [setSoundCallbacks, playShieldBreakSound, playCollisionSound, playExplosionSound, playStormSound, playIncomingSound]);

  const handleStart = () => {
    playStartSound();
    startGame();
  };

  const handleRestart = () => {
    playStartSound();
    restartGame();
  };

  const handleGameOver = () => {
    if (gameState.score <= 0) {
      playVictorySound();
    } else {
      playGameOverSound();
    }
  };

  // Play game over sound when screen changes to game-over
  useEffect(() => {
    if (screen === 'game-over') {
      handleGameOver();
    }
  }, [screen]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <StarField />
      
      <AnimatePresence mode="wait">
        {screen === 'menu' && (
          <MenuScreen
            key="menu"
            highScore={gameState.highScore}
            onStart={goToShipSelect}
          />
        )}

        {screen === 'ship-select' && (
          <ShipSelectScreen
            key="ship-select"
            ships={ships}
            onSelect={selectShip}
            onBack={goToMenu}
          />
        )}

        {screen === 'game' && (
          <GameScreen
            key="game"
            gameState={gameState}
            shipData={selectedShipData}
            onMove={movePlayer}
            onStart={handleStart}
            onMoveSound={playMoveSound}
            onToggleHitboxDebug={toggleHitboxDebug}
            hitboxConfig={hitboxConfig}
            isDebugMode={isDebugMode}
          />
        )}

        {screen === 'game-over' && (
          <GameOverScreen
            key="game-over"
            score={gameState.score}
            highScore={gameState.highScore}
            isNewHighScore={gameState.score === gameState.highScore && gameState.score < 2500}
            won={gameState.score <= 0}
            onRestart={handleRestart}
            onMenu={goToMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
