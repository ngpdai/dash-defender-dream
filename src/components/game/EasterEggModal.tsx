import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';

const QUESTIONS = [
  "INPUT A NUMBER",
  "INPUT SOMETHING",
  "INPUT YOUR NAME",
];

const VALID_ANSWERS = ['dai', 'tokudai'];

interface EasterEggModalProps {
  onSecretUnlocked: () => void;
}

const EasterEggModal = ({ onSecretUnlocked }: EasterEggModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [input, setInput] = useState('');

  const openModal = () => {
    setQuestion(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
    setInput('');
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (VALID_ANSWERS.includes(input.trim().toLowerCase())) {
      setIsOpen(false);
      onSecretUnlocked();
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* ? Button */}
      <motion.button
        whileHover={{ scale: 1.2, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        onClick={openModal}
        className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-muted/30 border border-muted/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
        title="?"
      >
        <HelpCircle className="w-5 h-5" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-space-medium border border-primary/30 rounded-xl p-6 mx-4 max-w-sm w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-orbitron text-lg text-primary text-glow-cyan">???</h3>
                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="font-rajdhani text-xl text-foreground mb-4 text-center">
                {question}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full px-4 py-2 bg-space-dark border border-primary/30 rounded-lg font-rajdhani text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  placeholder="Enter your answer..."
                  autoFocus
                  maxLength={50}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-2 font-orbitron font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  SUBMIT
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EasterEggModal;
