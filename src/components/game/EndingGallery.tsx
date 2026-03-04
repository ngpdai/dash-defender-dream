import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, Image as ImageIcon } from 'lucide-react';
import { loadGallery, clearNewUnlock, type GalleryData } from '@/lib/galleryStorage';
import endingGameover from '@/assets/ending-gameover.png';
import endingVictory from '@/assets/ending-victory.png';
import endingSecret from '@/assets/ending-secret.png';

interface SlotConfig {
  key: 'gameover' | 'victory' | 'secret';
  label: string;
  lockedLabel: string;
  image: string;
  description: string;
  borderColor: string;
  glowColor: string;
}

const SLOTS: SlotConfig[] = [
  {
    key: 'gameover',
    label: 'Collision',
    lockedLabel: 'Game Over',
    image: endingGameover,
    description: 'Your ship was destroyed in a collision with space debris.',
    borderColor: 'border-red-500',
    glowColor: '0 0 12px rgba(255, 68, 68, 0.6)',
  },
  {
    key: 'victory',
    label: 'Victory',
    lockedLabel: '25,000 KM',
    image: endingVictory,
    description: 'You completed the 25,000 KM journey successfully!',
    borderColor: 'border-emerald-400',
    glowColor: '0 0 12px rgba(0, 255, 136, 0.6)',
  },
  {
    key: 'secret',
    label: 'True Ending',
    lockedLabel: '???',
    image: endingSecret,
    description: 'You discovered the secret ending. The journey was worth it.',
    borderColor: 'border-yellow-400',
    glowColor: '0 0 12px rgba(255, 215, 0, 0.6)',
  },
];

const EndingGallery = () => {
  const [gallery, setGallery] = useState<GalleryData>(loadGallery);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewingSlot, setViewingSlot] = useState<SlotConfig | null>(null);

  // Refresh gallery data when modal opens
  useEffect(() => {
    if (modalOpen) setGallery(loadGallery());
  }, [modalOpen]);

  const unlockedCount = [gallery.gameover, gallery.victory, gallery.secret].filter(Boolean).length;

  const handleSlotClick = (slot: SlotConfig) => {
    if (!gallery[slot.key]) return;
    // Clear "NEW" badge
    if (gallery.newUnlocks.includes(slot.key)) {
      const updated = clearNewUnlock(slot.key);
      setGallery(updated);
    }
    setViewingSlot(slot);
  };

  return (
    <>
      {/* Compact gallery button on main menu */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        onClick={() => setModalOpen(true)}
        className="absolute top-6 right-6 z-20 flex flex-col items-center gap-1.5 group"
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-space-medium/60 border border-primary/30 group-hover:border-primary/60 transition-colors">
          <ImageIcon className="w-4 h-4 text-primary" />
          <span className="font-orbitron text-[10px] text-primary tracking-wider">GALLERY</span>
          <span className="font-rajdhani text-[10px] text-muted-foreground">{unlockedCount}/3</span>
        </div>
        <div className="flex gap-1">
          {SLOTS.map(slot => (
            <div
              key={slot.key}
              className={`w-8 h-8 rounded overflow-hidden border ${
                gallery[slot.key]
                  ? `${slot.borderColor} border-opacity-80`
                  : 'border-muted-foreground/30'
              }`}
            >
              {gallery[slot.key] ? (
                <img src={slot.image} alt={slot.label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                  <Lock className="w-3 h-3 text-muted-foreground/50" />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.button>

      {/* Gallery Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => { setModalOpen(false); setViewingSlot(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-space-dark border border-primary/30 rounded-xl p-6 max-w-lg w-full relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => { setModalOpen(false); setViewingSlot(null); }} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>

              <h2 className="font-orbitron text-xl text-primary text-glow-cyan text-center mb-1">ENDING GALLERY</h2>
              <p className="font-rajdhani text-sm text-muted-foreground text-center mb-6">{unlockedCount}/3 Endings Discovered</p>

              <AnimatePresence mode="wait">
                {viewingSlot ? (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col items-center"
                  >
                    <button
                      onClick={() => setViewingSlot(null)}
                      className="self-start font-rajdhani text-sm text-primary hover:underline mb-3"
                    >
                      ← Back
                    </button>
                    <div
                      className={`rounded-lg overflow-hidden border-2 ${viewingSlot.borderColor} mb-4 max-h-[50vh]`}
                      style={{ boxShadow: viewingSlot.glowColor }}
                    >
                      <img src={viewingSlot.image} alt={viewingSlot.label} className="w-full h-auto max-h-[50vh] object-contain" />
                    </div>
                    <h3 className="font-orbitron text-lg text-foreground mb-1">{viewingSlot.label}</h3>
                    <p className="font-rajdhani text-sm text-muted-foreground text-center">{viewingSlot.description}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-3 gap-4"
                  >
                    {SLOTS.map(slot => {
                      const unlocked = gallery[slot.key];
                      const isNew = gallery.newUnlocks.includes(slot.key);
                      return (
                        <motion.button
                          key={slot.key}
                          whileHover={unlocked ? { scale: 1.08 } : undefined}
                          whileTap={unlocked ? { scale: 0.95 } : undefined}
                          onClick={() => handleSlotClick(slot)}
                          className={`relative flex flex-col items-center gap-2 p-2 rounded-lg border transition-all ${
                            unlocked
                              ? `${slot.borderColor} cursor-pointer hover:brightness-110`
                              : 'border-muted-foreground/20 cursor-default opacity-50'
                          }`}
                          style={unlocked ? { boxShadow: slot.glowColor } : undefined}
                        >
                          <div className="w-full aspect-[3/4] rounded overflow-hidden bg-muted/20 relative">
                            {unlocked ? (
                              <img src={slot.image} alt={slot.label} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Lock className="w-6 h-6 text-muted-foreground/40" />
                              </div>
                            )}
                            {isNew && (
                              <motion.span
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="absolute top-1 right-1 bg-secondary text-secondary-foreground text-[9px] font-orbitron px-1.5 py-0.5 rounded-full"
                              >
                                NEW!
                              </motion.span>
                            )}
                          </div>
                          <span className="font-rajdhani text-xs text-foreground">
                            {unlocked ? slot.label : slot.lockedLabel}
                          </span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EndingGallery;
