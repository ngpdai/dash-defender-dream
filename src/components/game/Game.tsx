import { AnimatePresence } from 'framer-motion';
import { useGameState } from '@/hooks/useGameState';
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
  } = useGameState();

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
            onStart={startGame}
          />
        )}

        {screen === 'game-over' && (
          <GameOverScreen
            key="game-over"
            score={gameState.score}
            highScore={gameState.highScore}
            isNewHighScore={gameState.score === gameState.highScore && gameState.score > 0}
            won={gameState.score <= 0}
            onRestart={restartGame}
            onMenu={goToMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
