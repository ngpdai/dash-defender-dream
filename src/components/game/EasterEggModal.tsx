// ============================================================================
// EasterEggModal.tsx — Hai modal "trứng phục sinh" của game.
// 1) EasterEggModal (default export): nút "?" ở màn Game Over — hỏi ngẫu nhiên
//    1 câu, nhập đúng "dai" hoặc "tokudai" → mở khóa secret ending.
// 2) SecretCodeModal (named export): mở khi click HIGH SCORE ở menu sau khi
//    đã mở đủ 3 ending — nhập đúng "ManlyBadassHero" → unlock nút bí mật
//    trong gallery (so sánh không phân biệt hoa thường).
// ============================================================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';

// Danh sách câu hỏi ngẫu nhiên cho modal "?" (chỉ là gây nhiễu để giấu đáp án).
const QUESTIONS = [
  "INPUT A NUMBER",
  "INPUT SOMETHING",
  "INPUT YOUR NAME",
];

// Các đáp án hợp lệ cho easter egg ở Game Over (so sánh chữ thường).
const VALID_ANSWERS = ['dai', 'tokudai'];

interface EasterEggModalProps {
  onSecretUnlocked: () => void;
}

/** Modal easter egg gốc — nút "?" ở màn Game Over. */
const EasterEggModal = ({ onSecretUnlocked }: EasterEggModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState<'none' | 'success' | 'error'>('none');

  const openModal = () => {
    setQuestion(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
    setInput('');
    setShake(false);
    setFlash('none');
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (VALID_ANSWERS.includes(input.trim().toLowerCase())) {
      setFlash('success');
      setTimeout(() => { setIsOpen(false); setFlash('none'); onSecretUnlocked(); }, 500);
    } else {
      setFlash('error');
      setShake(true);
      setTimeout(() => { setShake(false); setFlash('none'); setIsOpen(false); }, 600);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.2, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        onClick={openModal}
        className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-muted/30 border border-muted/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
        title="?"
      >
        <HelpCircle className="w-5 h-5" />
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70" onClick={() => setIsOpen(false)}>
            {flash === 'success' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 0.5 }} className="absolute inset-0 bg-primary/40 z-[201]" />}
            {flash === 'error' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.4, 0] }} transition={{ duration: 0.4 }} className="absolute inset-0 bg-destructive/30 z-[201]" />}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, x: shake ? [0, -8, 8, -6, 6, -3, 3, 0] : 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={shake ? { x: { duration: 0.5 } } : undefined}
              onClick={e => e.stopPropagation()}
              className={`bg-space-medium border rounded-xl p-6 mx-4 max-w-sm w-full z-[202] ${flash === 'success' ? 'border-primary box-glow-cyan' : flash === 'error' ? 'border-destructive box-glow-pink' : 'border-primary/30'}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-orbitron text-lg text-primary text-glow-cyan">???</h3>
                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <p className="font-rajdhani text-xl text-foreground mb-4 text-center">{question}</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" value={input} onChange={e => setInput(e.target.value)} className="w-full px-4 py-2 bg-space-dark border border-primary/30 rounded-lg font-rajdhani text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" placeholder="Enter your answer..." autoFocus maxLength={50} />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full py-2 font-orbitron font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors">SUBMIT</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/** Secret code modal for HIGH SCORE click (gallery 4th unlock) */
export interface SecretCodeModalProps {
  open: boolean;
  onClose: () => void;
  onCorrectCode: () => void;
}

// Mã bí mật cần nhập — so sánh lowercase nên user có thể gõ "ManlyBadassHero",
// "MANLYBADASSHERO", "manlybadasshero"... đều được chấp nhận.
const SECRET_CODE = 'manlybadasshero';

// Modal nhập mã bí mật — mở từ MenuScreen khi đã mở hết 3 ending.
// Nhập đúng → gọi onCorrectCode() để unlock nút bí mật trong gallery.
export const SecretCodeModal = ({ open, onClose, onCorrectCode }: SecretCodeModalProps) => {
  const [value, setValue] = useState('');

  // Khi submit: chuẩn hóa input (trim + lowercase) rồi so với SECRET_CODE.
  // Dù đúng hay sai đều reset input và đóng modal sau đó.
  const handleSubmit = () => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === SECRET_CODE) {
      onCorrectCode();
    }
    setValue('');
    onClose();
  };


  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-space-dark border border-primary/40 rounded-xl p-6 w-full max-w-sm relative"
            style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            <h2 className="font-orbitron text-lg text-primary text-glow-cyan text-center mb-1">ENTER YOUR NAME</h2>
            <p className="font-rajdhani text-sm text-muted-foreground text-center mb-5">Prove your worth, space pilot...</p>
            <input
              autoFocus
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              maxLength={50}
              placeholder="Your name here"
              className="w-full px-4 py-3 rounded-lg bg-space-medium border border-primary/30 text-foreground font-rajdhani text-base placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/70 transition-colors mb-5"
            />
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg font-orbitron text-sm text-muted-foreground bg-space-medium border border-muted-foreground/20 hover:bg-space-medium/80 transition-colors">CANCEL</button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-lg font-orbitron text-sm text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">SUBMIT</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EasterEggModal;
