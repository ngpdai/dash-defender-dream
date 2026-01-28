import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  won: boolean;
  onRestart: () => void;
  onMenu: () => void;
}

const GameOverScreen = ({
  score,
  highScore,
  isNewHighScore,
  won,
  onRestart,
  onMenu,
}: GameOverScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
    >
      {/* Result */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="text-center mb-8"
      >
        {won ? (
          <>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 3 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-primary text-glow-cyan mb-2">
              MISSION COMPLETE
            </h1>
            <p className="font-rajdhani text-xl text-muted-foreground">
              You reached your destination!
            </p>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring' }}
              className="text-6xl mb-4"
            >
              💥
            </motion.div>
            <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-secondary text-glow-pink mb-2">
              GAME OVER
            </h1>
            <p className="font-rajdhani text-xl text-muted-foreground">
              Your ship was destroyed
            </p>
          </>
        )}
      </motion.div>

      {/* Score Card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-space-medium/50 border border-primary/30 rounded-xl p-8 mb-8 text-center"
      >
        {/* New High Score Badge */}
        {isNewHighScore && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
            className="flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-secondary/20 rounded-full border border-secondary/50"
          >
            <Sparkles className="w-5 h-5 text-secondary" />
            <span className="font-orbitron text-sm text-secondary">NEW HIGH SCORE!</span>
            <Sparkles className="w-5 h-5 text-secondary" />
          </motion.div>
        )}

        {/* Final Score */}
        <div className="mb-6">
          <p className="font-rajdhani text-lg text-muted-foreground mb-2">REMAINING DISTANCE</p>
          <p className="font-orbitron text-5xl md:text-6xl font-bold text-primary text-glow-cyan">
            {score.toLocaleString()}
            <span className="text-2xl ml-2">KM</span>
          </p>
        </div>

        {/* Best Score (lowest = traveled farthest) */}
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-secondary" />
          <span className="font-rajdhani text-lg text-muted-foreground">
            Best Distance: <span className="text-secondary font-bold">{highScore.toLocaleString()} KM remaining</span>
          </span>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRestart}
          className="flex items-center justify-center gap-3 px-8 py-4 font-orbitron font-bold text-primary-foreground bg-primary rounded-lg box-glow-cyan hover:bg-primary/90 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          TRY AGAIN
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMenu}
          className="flex items-center justify-center gap-3 px-8 py-4 font-orbitron font-bold text-foreground bg-space-medium border border-primary/50 rounded-lg hover:bg-space-medium/80 transition-colors"
        >
          <Home className="w-5 h-5" />
          MAIN MENU
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default GameOverScreen;
