import { motion } from 'framer-motion';
import speederShipImg from '@/assets/speeder-ship.png';
import titanShipImg from '@/assets/titan-ship.png';

// Titan MK-II - Heavy, sturdy battleship design
export const TitanShip = ({ isInvincible, godMode }: { isInvincible?: boolean; godMode?: boolean }) => (
  <motion.div
    animate={{ 
      y: [0, -3, 0],
      scale: isInvincible ? [1, 1.1, 1] : 1,
    }}
    transition={{ 
      y: { duration: 0.5, repeat: Infinity },
      scale: isInvincible ? { duration: 0.15, repeat: Infinity } : { duration: 0 },
    }}
    className="relative w-[60px] h-[84px] md:w-[72px] md:h-[96px]"
  >
    {/* God Mode gold glow */}
    {godMode && (
      <motion.div
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-0 -m-5 rounded-full"
        style={{ 
          boxShadow: '0 0 25px rgba(255, 215, 0, 0.7), 0 0 50px rgba(255, 215, 0, 0.3)',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%)',
        }}
      />
    )}
    <img 
      src={titanShipImg} 
      alt="Titan MK-II" 
      className="w-full h-full object-contain"
    />
  </motion.div>
);

// Speeder X-1 - Fast, sleek design
export const SpeederShip = ({ isInvincible, overdriveActive, godMode }: { isInvincible?: boolean; overdriveActive?: boolean; godMode?: boolean }) => (
  <motion.div
    animate={{ 
      y: [0, -3, 0],
      scale: isInvincible ? [1, 1.1, 1] : 1,
    }}
    transition={{ 
      y: { duration: 0.5, repeat: Infinity },
      scale: isInvincible ? { duration: 0.15, repeat: Infinity } : { duration: 0 },
    }}
    className="relative w-[60px] h-[84px] md:w-[72px] md:h-[96px]"
  >
    {/* God Mode gold glow */}
    {godMode && !overdriveActive && (
      <motion.div
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-0 -m-5 rounded-full"
        style={{ 
          boxShadow: '0 0 25px rgba(255, 215, 0, 0.7), 0 0 50px rgba(255, 215, 0, 0.3)',
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%)',
        }}
      />
    )}
    {/* Overdrive aura */}
    {overdriveActive && (
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="absolute inset-0 -m-6 rounded-full bg-primary/20 border-2 border-primary/60"
        style={{ boxShadow: '0 0 30px hsl(180 100% 50% / 0.6), 0 0 60px hsl(180 100% 50% / 0.3)' }}
      />
    )}
    <img 
      src={speederShipImg} 
      alt="Speeder X-1" 
      className="w-full h-full object-contain"
    />
  </motion.div>
);

// Asteroid - Dangerous space rock with neon accents
export const AsteroidVisual = ({ type }: { type: 'asteroid' | 'debris' | 'mine' }) => {
  if (type === 'asteroid') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="relative w-10 h-10"
      >
        {/* Main rock body */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-[40%_60%_55%_45%] border border-slate-500/50">
          {/* Crater details */}
          <div className="absolute top-2 left-2 w-2 h-2 bg-slate-800 rounded-full opacity-60" />
          <div className="absolute bottom-3 right-2 w-1.5 h-1.5 bg-slate-900 rounded-full opacity-50" />
          <div className="absolute top-4 right-3 w-1 h-1 bg-slate-800 rounded-full opacity-40" />
        </div>
        {/* Danger glow */}
        <div className="absolute inset-0 rounded-full blur-md bg-orange-500/20 -z-10" />
        {/* Hot spots */}
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute top-1 right-1 w-2 h-2 bg-orange-500/60 rounded-full blur-sm"
        />
      </motion.div>
    );
  }

  if (type === 'debris') {
    return (
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        className="relative w-8 h-8"
      >
        {/* Metallic debris */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-500 via-zinc-600 to-zinc-700 rounded-[30%_70%_60%_40%] border border-zinc-400/30">
          {/* Metal shine */}
          <div className="absolute top-1 left-1 w-3 h-1 bg-zinc-300/40 rounded-full rotate-45" />
        </div>
        {/* Sparks */}
        <motion.div 
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute -top-1 left-1/2 w-1 h-1 bg-yellow-400 rounded-full blur-sm"
        />
      </motion.div>
    );
  }

  // Mine
  return (
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 0.8, repeat: Infinity }}
      className="relative w-8 h-8"
    >
      {/* Mine body */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-800 to-red-900 rounded-full border-2 border-red-500/50">
        {/* Warning light */}
        <motion.div 
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-400 rounded-full"
        />
      </div>
      {/* Danger glow */}
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="absolute inset-0 rounded-full blur-lg bg-red-500/40 -z-10"
      />
    </motion.div>
  );
};

// UFO Enemy - Alien ship
export const UFOVisual = ({ isExploding }: { isExploding: boolean }) => {
  if (isExploding) {
    return null; // Remove explosion visual as requested
  }

  return (
    <div
      className="relative w-12 h-12"
    >
      {/* UFO body */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Dome */}
        <div className="absolute top-1 w-5 h-4 bg-gradient-to-b from-purple-400 to-purple-600 rounded-t-full border border-purple-300/50">
          {/* Cockpit glow */}
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-1 bg-gradient-to-b from-cyan-300/80 to-transparent rounded-t-full"
          />
        </div>
        
        {/* Main disc */}
        <div className="absolute top-4 w-11 h-3 bg-gradient-to-b from-purple-500 via-purple-600 to-purple-800 rounded-full border border-purple-400/40">
          {/* Ring lights */}
          <div className="absolute inset-0 flex items-center justify-around px-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                style={{ boxShadow: '0 0 4px hsl(var(--primary))' }}
              />
            ))}
          </div>
        </div>
        
        {/* Bottom beam area */}
        <div className="absolute bottom-1 w-4 h-2 bg-gradient-to-b from-purple-700 to-purple-900 rounded-b" />
      </div>
      
      {/* Tractor beam effect */}
      <motion.div 
        animate={{ opacity: [0.2, 0.5, 0.2], scaleY: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-b from-purple-400/40 to-transparent rounded-full blur-sm"
      />
      
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full blur-lg bg-purple-500/30 -z-10" />
    </div>
  );
};

// Ship preview for selection screen
export const ShipPreview = ({ shipId, color }: { shipId: 'speeder' | 'tank'; color: string }) => {
  if (shipId === 'speeder') {
    return (
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-[120px] h-[144px]"
      >
        <img 
          src={speederShipImg} 
          alt="Speeder X-1" 
          className="w-full h-full object-contain"
        />
      </motion.div>
    );
  }

  // Titan
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-[120px] h-[144px]"
    >
      <img 
        src={titanShipImg} 
        alt="Titan MK-II" 
        className="w-full h-full object-contain"
      />
    </motion.div>
  );
};
