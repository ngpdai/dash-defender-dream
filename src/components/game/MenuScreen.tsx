import { motion } from 'framer-motion';
import { Play, Trophy, Rocket } from 'lucide-react';

interface MenuScreenProps {
  highScore: number;
  onStart: () => void;
}

const MenuScreen = ({ highScore, onStart }: MenuScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
    >
      {/* Title */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <Rocket className="w-12 h-12 text-primary animate-pulse-glow" />
        </div>
        <h1 className="font-orbitron text-6xl md:text-8xl font-bold text-primary text-glow-cyan mb-2">
          25,000
        </h1>
        <h2 className="font-orbitron text-4xl md:text-6xl font-bold text-secondary text-glow-pink">
          KM
        </h2>
        <p className="font-rajdhani text-lg md:text-xl text-muted-foreground mt-4 tracking-wider">
          SPACE OBSTACLE RUNNER
        </p>
      </motion.div>

      {/* High Score */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-3 mb-8 px-6 py-3 bg-space-medium/50 rounded-full border border-primary/30"
      >
        <Trophy className="w-5 h-5 text-secondary" />
        <span className="font-orbitron text-lg text-foreground">
          HIGH SCORE: <span className="text-primary">{highScore}</span>
        </span>
      </motion.div>

      {/* Start Button */}
      <motion.button
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="group relative flex items-center gap-4 px-12 py-5 font-orbitron text-xl font-bold text-primary-foreground bg-primary rounded-lg overflow-hidden transition-all duration-300 box-glow-cyan hover:bg-primary/90"
      >
        <span className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <Play className="w-6 h-6 relative z-10" />
        <span className="relative z-10">START MISSION</span>
      </motion.button>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-center"
      >
        <p className="font-rajdhani text-muted-foreground text-sm">
          Use <span className="text-primary">↑↓←→</span> or <span className="text-primary">WASD</span> to control
        </p>
        <p className="font-rajdhani text-muted-foreground text-sm mt-1">
          Swipe on mobile devices
        </p>
      </motion.div>

      {/* Decorative elements */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1 + i * 0.1 }}
            className="w-2 h-2 rounded-full bg-primary/50"
          />
        ))}
      </div>
    </motion.div>
  );
};

export default MenuScreen;
