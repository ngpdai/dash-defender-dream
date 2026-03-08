import { useEffect } from 'react';
import { unlockEnding } from '@/lib/galleryStorage';

const isDebugEnvironment = () => {
  return (
    window.location.hostname === 'localhost' ||
    window.location.search.includes('debug=true')
  );
};

interface UseDebugShortcutsProps {
  isMenuScreen: boolean;
  onTriggerEnding2: () => void;
}

export const useDebugShortcuts = ({ isMenuScreen, onTriggerEnding2 }: UseDebugShortcutsProps) => {
  useEffect(() => {
    if (!isDebugEnvironment() || !isMenuScreen) return;

    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.shiftKey) return;

      if (e.key === '@' || e.code === 'Digit2') {
        e.preventDefault();
        onTriggerEnding2();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isMenuScreen, onTriggerEnding2]);
};
