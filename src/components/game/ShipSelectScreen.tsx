import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Shield, Heart } from 'lucide-react';
import { Ship, ShipType } from '@/types/game';
import { ShipPreview } from './GameVisuals';

interface ShipSelectScreenProps {
  ships: Record<ShipType, Ship>;
  onSelect: (ship: ShipType) => void;
  onBack: () => void;
}

const ShipSelectScreen = ({ ships, onSelect, onBack }: ShipSelectScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
    >
      {/* Back Button */}
      <motion.button
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-rajdhani">Back</span>
      </motion.button>

      {/* Title */}
      <motion.h2
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-orbitron text-3xl md:text-4xl font-bold text-primary text-glow-cyan mb-12"
      >
        SELECT YOUR SHIP
      </motion.h2>

      {/* Ship Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {Object.values(ships).map((ship, index) => (
          <motion.button
            key={ship.id}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(ship.id)}
            className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
              ship.color === 'cyan'
                ? 'border-primary/50 hover:border-primary bg-space-medium/30 hover:bg-space-medium/50 box-glow-cyan'
                : 'border-secondary/50 hover:border-secondary bg-space-medium/30 hover:bg-space-medium/50 box-glow-pink'
            }`}
          >
            {/* Ship Visualization - Custom component */}
            <div className="relative h-32 mb-6 flex items-center justify-center">
              <ShipPreview shipId={ship.id} color={ship.color} />
            </div>

            {/* Ship Info */}
            <h3
              className={`font-orbitron text-xl font-bold mb-2 ${
                ship.color === 'cyan' ? 'text-primary' : 'text-secondary'
              }`}
            >
              {ship.name}
            </h3>
            <p className="font-rajdhani text-muted-foreground text-sm mb-4">
              {ship.description}
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${ship.color === 'cyan' ? 'text-primary' : 'text-secondary'}`} />
                <span className="font-rajdhani text-foreground">
                  Speed: {ship.speed}x
                </span>
              </div>
              {ship.shield && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-rajdhani text-foreground">Shield</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Heart className={`w-4 h-4 ${ship.color === 'cyan' ? 'text-primary' : 'text-secondary'}`} />
                <span className="font-rajdhani text-foreground">
                  HP: {ship.lives}
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default ShipSelectScreen;
