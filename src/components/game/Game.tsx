import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameState } from '@/hooks/useGameState';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useDebugShortcuts } from '@/hooks/useDebugShortcuts';
import { unlockEnding } from '@/lib/galleryStorage';
import StarField from './StarField';
import MenuScreen from './MenuScreen';
import ShipSelectScreen from './ShipSelectScreen';
import GameScreen from './GameScreen';
import GameOverScreen from './GameOverScreen';
import EndingSceneViewer from './EndingSceneViewer';

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
    getDebugInfo,
    collisionConfig,
    isDebugMode,
    triggerSecretVictory,
    secretVictory,
    onFlashComplete,
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
    if (gameState.score <= 0 || secretVictory) {
      playVictorySound();
    } else {
      playGameOverSound();
    }
  };

  const handleFlashComplete = () => {
    onFlashComplete();
  };

  // Play game over sound and unlock gallery ending when screen changes to game-over or ending-scene
  useEffect(() => {
    if (screen === 'game-over') {
      handleGameOver();
      if (secretVictory) {
        unlockEnding('secret');
      } else {
        unlockEnding('gameover');
      }
    }
    if (screen === 'ending-scene') {
      playVictorySound();
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
            getDebugInfo={getDebugInfo}
            collisionConfig={collisionConfig}
            isDebugMode={isDebugMode}
            onSecretVictory={triggerSecretVictory}
            onFlashComplete={handleFlashComplete}
          />
        )}

        {screen === 'ending-scene' && (
          <EndingSceneViewer
            key="ending-scene"
            onComplete={() => {
              unlockEnding('victory');
              goToMenu();
            }}
          />
        )}

        {screen === 'game-over' && (
          <GameOverScreen
            key="game-over"
            score={gameState.score}
            highScore={gameState.highScore}
            isNewHighScore={gameState.score === gameState.highScore && gameState.score < 25000}
            won={gameState.score <= 0}
            secretVictory={secretVictory}
            onRestart={handleRestart}
            onMenu={goToMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
