import { motion } from 'framer-motion';

// Titan MK-II - Heavy, sturdy battleship design
export const TitanShip = ({ isInvincible }: { isInvincible?: boolean }) => (
  <motion.div
    animate={{ 
      y: [0, -3, 0],
      scale: isInvincible ? [1, 1.1, 1] : 1,
    }}
    transition={{ 
      y: { duration: 0.5, repeat: Infinity },
      scale: isInvincible ? { duration: 0.15, repeat: Infinity } : { duration: 0 },
    }}
    className="relative w-12 h-14 md:w-14 md:h-16"
  >
    {/* Main hull */}
    <div className="absolute inset-0 flex flex-col items-center">
      {/* Cockpit */}
      <div className="w-4 h-3 bg-gradient-to-b from-secondary to-secondary/60 rounded-t-full border border-secondary/80" />
      
      {/* Upper body */}
      <div className="w-8 h-4 bg-gradient-to-b from-secondary/80 to-secondary/40 border-x border-secondary/60" />
      
      {/* Main body - wider, more armored look */}
      <div className="w-10 h-5 bg-gradient-to-b from-secondary/60 to-secondary/30 border border-secondary/50 relative">
        {/* Armor plating details */}
        <div className="absolute left-1 top-1 w-1 h-3 bg-secondary/40 rounded-sm" />
        <div className="absolute right-1 top-1 w-1 h-3 bg-secondary/40 rounded-sm" />
      </div>
      
      {/* Engine section */}
      <div className="flex gap-1">
        <div className="w-3 h-2 bg-gradient-to-b from-secondary/50 to-transparent rounded-b" />
        <div className="w-4 h-3 bg-gradient-to-b from-secondary/60 to-transparent rounded-b" />
        <div className="w-3 h-2 bg-gradient-to-b from-secondary/50 to-transparent rounded-b" />
      </div>
    </div>
    
    {/* Engine glow effects */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-1">
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5], scaleY: [1, 1.3, 1] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        className="w-2 h-4 bg-gradient-to-b from-secondary via-pink-400 to-transparent rounded-full blur-sm"
      />
      <motion.div 
        animate={{ opacity: [0.7, 1, 0.7], scaleY: [1, 1.5, 1] }}
        transition={{ duration: 0.25, repeat: Infinity }}
        className="w-3 h-5 bg-gradient-to-b from-secondary via-pink-300 to-transparent rounded-full blur-sm"
      />
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5], scaleY: [1, 1.3, 1] }}
        transition={{ duration: 0.3, repeat: Infinity, delay: 0.1 }}
        className="w-2 h-4 bg-gradient-to-b from-secondary via-pink-400 to-transparent rounded-full blur-sm"
      />
    </div>
    
    {/* Neon glow outline */}
    <div className="absolute inset-0 rounded blur-md bg-secondary/30 -z-10" />
  </motion.div>
);

// Speeder X-1 - Fast, sleek design
export const SpeederShip = ({ isInvincible }: { isInvincible?: boolean }) => (
  <motion.div
    animate={{ 
      y: [0, -3, 0],
      scale: isInvincible ? [1, 1.1, 1] : 1,
    }}
    transition={{ 
      y: { duration: 0.5, repeat: Infinity },
      scale: isInvincible ? { duration: 0.15, repeat: Infinity } : { duration: 0 },
    }}
    className="relative w-10 h-14 md:w-12 md:h-16"
  >
    {/* Main body - sleek arrow shape */}
    <div className="absolute inset-0 flex flex-col items-center">
      {/* Nose cone */}
      <div 
        className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-primary"
        style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary)))' }}
      />
      
      {/* Cockpit */}
      <div className="w-4 h-3 bg-gradient-to-b from-cyan-300 to-primary rounded-sm border border-primary/80" />
      
      {/* Body */}
      <div className="w-6 h-4 bg-gradient-to-b from-primary/80 to-primary/50 border-x border-primary/60" />
      
      {/* Wings */}
      <div className="flex items-start -mt-2">
        <div 
          className="w-0 h-0 border-t-[6px] border-r-[10px] border-t-transparent border-r-primary/70"
          style={{ transform: 'skewY(-10deg)' }}
        />
        <div className="w-4 h-3 bg-gradient-to-b from-primary/60 to-primary/30" />
        <div 
          className="w-0 h-0 border-t-[6px] border-l-[10px] border-t-transparent border-l-primary/70"
          style={{ transform: 'skewY(10deg)' }}
        />
      </div>
      
      {/* Engine */}
      <div className="w-3 h-2 bg-gradient-to-b from-primary/50 to-transparent rounded-b" />
    </div>
    
    {/* Engine glow */}
    <motion.div 
      animate={{ opacity: [0.6, 1, 0.6], scaleY: [1, 1.4, 1] }}
      transition={{ duration: 0.2, repeat: Infinity }}
      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-5 bg-gradient-to-b from-primary via-cyan-300 to-transparent rounded-full blur-sm"
    />
    
    {/* Neon glow outline */}
    <div className="absolute inset-0 rounded blur-md bg-primary/30 -z-10" />
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
        className="relative w-20 h-24"
      >
        <div className="absolute inset-0 flex flex-col items-center scale-150">
          {/* Nose cone */}
          <div 
            className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[18px] border-l-transparent border-r-transparent border-b-primary"
            style={{ filter: 'drop-shadow(0 0 6px hsl(var(--primary)))' }}
          />
          
          {/* Cockpit */}
          <div className="w-6 h-4 bg-gradient-to-b from-cyan-300 to-primary rounded-sm border border-primary/80" />
          
          {/* Body */}
          <div className="w-8 h-5 bg-gradient-to-b from-primary/80 to-primary/50 border-x border-primary/60" />
          
          {/* Wings */}
          <div className="flex items-start -mt-3">
            <div className="w-0 h-0 border-t-[8px] border-r-[14px] border-t-transparent border-r-primary/70" />
            <div className="w-5 h-4 bg-gradient-to-b from-primary/60 to-primary/30" />
            <div className="w-0 h-0 border-t-[8px] border-l-[14px] border-t-transparent border-l-primary/70" />
          </div>
        </div>
        
        {/* Engine glow */}
        <motion.div 
          animate={{ opacity: [0.6, 1, 0.6], scaleY: [1, 1.4, 1] }}
          transition={{ duration: 0.2, repeat: Infinity }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-8 bg-gradient-to-b from-primary via-cyan-300 to-transparent rounded-full blur-md"
        />
        
        {/* Glow */}
        <div className="absolute inset-0 blur-xl bg-primary/20 -z-10" />
      </motion.div>
    );
  }

  // Titan
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-24 h-28"
    >
      <div className="absolute inset-0 flex flex-col items-center scale-150">
        {/* Cockpit */}
        <div className="w-6 h-4 bg-gradient-to-b from-secondary to-secondary/60 rounded-t-full border border-secondary/80" />
        
        {/* Upper body */}
        <div className="w-10 h-5 bg-gradient-to-b from-secondary/80 to-secondary/40 border-x border-secondary/60" />
        
        {/* Main body */}
        <div className="w-14 h-6 bg-gradient-to-b from-secondary/60 to-secondary/30 border border-secondary/50 relative">
          <div className="absolute left-1 top-1 w-1.5 h-4 bg-secondary/40 rounded-sm" />
          <div className="absolute right-1 top-1 w-1.5 h-4 bg-secondary/40 rounded-sm" />
        </div>
        
        {/* Engines */}
        <div className="flex gap-1.5">
          <div className="w-4 h-3 bg-gradient-to-b from-secondary/50 to-transparent rounded-b" />
          <div className="w-5 h-4 bg-gradient-to-b from-secondary/60 to-transparent rounded-b" />
          <div className="w-4 h-3 bg-gradient-to-b from-secondary/50 to-transparent rounded-b" />
        </div>
      </div>
      
      {/* Engine glow */}
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5], scaleY: [1, 1.3, 1] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-b from-secondary via-pink-400 to-transparent rounded-full blur-md"
      />
      
      {/* Glow */}
      <div className="absolute inset-0 blur-xl bg-secondary/20 -z-10" />
    </motion.div>
  );
};
