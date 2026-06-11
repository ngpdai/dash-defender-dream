// ============================================================================
// MenuScreen.tsx — Màn hình MENU CHÍNH của game.
// Hiển thị tiêu đề, high score, nút START, và quản lý easter egg + gallery
// các ending đã mở khóa.
// ============================================================================
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trophy, Rocket } from 'lucide-react';
import EndingGallery from './EndingGallery';
import { SecretCodeModal } from './EasterEggModal';
import { loadGallery, isAllEndingsUnlocked, loadEasterEgg, saveEasterEgg } from '@/lib/galleryStorage';

// Props: nhận high score hiện tại + callback khi user bấm START.
interface MenuScreenProps {
  highScore: number;
  onStart: () => void;
}

const MenuScreen = ({ highScore, onStart }: MenuScreenProps) => {
  // State quản lý modal nhập mã bí mật và animation "Subscribe".
  const [modalOpen, setModalOpen] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  // Đọc trạng thái easter egg & ending đã mở từ localStorage (chỉ chạy 1 lần khi mount).
  const [eggEntered, setEggEntered] = useState(() => loadEasterEgg().codeEntered);
  const [allUnlocked, setAllUnlocked] = useState(() => isAllEndingsUnlocked(loadGallery()));

  // Mỗi lần component mount (quay về menu) → refresh lại trạng thái gallery
  // để phản ánh các ending mới mở khóa trong lần chơi vừa rồi.
  useEffect(() => {
    setAllUnlocked(isAllEndingsUnlocked(loadGallery()));
    setEggEntered(loadEasterEgg().codeEntered);
  }, []);

  // Chỉ cho phép click vào "HIGH SCORE" để mở modal mã bí mật khi
  // người chơi đã mở hết 3 ending (đây là điều kiện kích hoạt easter egg).
  const handleHighScoreClick = () => {
    if (!allUnlocked) return;
    setModalOpen(true);
  };

  // Xử lý khi user nhập đúng mã bí mật "ManlyBadassHero":
  // lưu vào localStorage, mở khóa nút bí mật, và hiện text "Subscribe" 5s.
  const handleCorrectCode = () => {
    saveEasterEgg({ codeEntered: true });
    setEggEntered(true);
    setShowSubscribe(true);
    setTimeout(() => setShowSubscribe(false), 5000);
  };



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
    >
      {/* Ending Gallery */}
      <EndingGallery showUnlockButton={allUnlocked && eggEntered} />

      {/* Easter Egg Modal */}
      <SecretCodeModal open={modalOpen} onClose={() => setModalOpen(false)} onCorrectCode={handleCorrectCode} />

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

        {/* Subscribe text animation */}
        <AnimatePresence>
          {showSubscribe && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="font-rajdhani italic text-2xl mt-4"
              style={{ color: '#FFD700', textShadow: '0 0 12px rgba(255, 215, 0, 0.7)' }}
            >
              <motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
                ✨ Subscribe ✨
              </motion.span>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* High Score — clickable when 3/3 */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={handleHighScoreClick}
        className={`flex items-center gap-3 mb-8 px-6 py-3 bg-space-medium/50 rounded-full border transition-all ${
          allUnlocked
            ? 'border-primary/60 cursor-pointer hover:border-primary hover:brightness-125'
            : 'border-primary/30'
        }`}
        style={allUnlocked ? { boxShadow: '0 0 10px rgba(0,255,255,0.2)' } : undefined}
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
