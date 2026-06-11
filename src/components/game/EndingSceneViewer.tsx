// ============================================================================
// EndingSceneViewer.tsx — Trình chiếu cinematic ENDING chiến thắng.
// Hiển thị tuần tự 4 ảnh tĩnh (scene1→scene4); người chơi tap màn hình
// để chuyển ảnh. Có khóa debounce 300ms tránh double-tap nhảy 2 ảnh.
// Ảnh cuối hiện nút "MAIN MENU" thay vì tap-to-continue.
// ============================================================================
import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Home } from 'lucide-react';
import scene1 from '@/assets/ending2-scene1.png';
import scene2 from '@/assets/ending2-scene2.png';
import scene3 from '@/assets/ending2-scene3.png';
import scene4 from '@/assets/ending2-scene4.png';

const SCENES = [scene1, scene2, scene3, scene4];

interface EndingSceneViewerProps {
  onComplete: () => void;
}

const EndingSceneViewer = ({ onComplete }: EndingSceneViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const lockRef = useRef(false);

  const advance = useCallback(() => {
    if (lockRef.current) return;
    if (currentIndex >= SCENES.length - 1) return; // last image, no advance
    lockRef.current = true;
    setCurrentIndex(prev => prev + 1);
    // Debounce ~300ms to prevent double-tap
    setTimeout(() => { lockRef.current = false; }, 300);
  }, [currentIndex]);

  const isLastImage = currentIndex === SCENES.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex items-center justify-center"
      onClick={!isLastImage ? advance : undefined}
      onTouchEnd={!isLastImage ? (e) => { e.preventDefault(); advance(); } : undefined}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={SCENES[currentIndex]}
          alt={`Ending scene ${currentIndex + 1}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-full max-h-full object-contain select-none pointer-events-none"
          draggable={false}
        />
      </AnimatePresence>

      {/* Tap indicator for images 1-3 */}
      {!isLastImage && (
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-8 right-8 flex items-center gap-2 text-muted-foreground select-none pointer-events-none"
        >
          <span className="font-rajdhani text-sm">Tap to continue</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      )}

      {/* Main Menu button on final image */}
      {isLastImage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); onComplete(); }}
            className="flex items-center gap-3 px-8 py-4 font-orbitron font-bold text-foreground bg-space-medium border border-primary/50 rounded-lg hover:bg-space-medium/80 transition-colors"
          >
            <Home className="w-5 h-5" />
            MAIN MENU
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EndingSceneViewer;
