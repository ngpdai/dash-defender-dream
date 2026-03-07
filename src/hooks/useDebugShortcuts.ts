import { useEffect, useState, useCallback } from 'react';
import { unlockEnding, loadGallery, saveGallery, loadEasterEgg, saveEasterEgg } from '@/lib/galleryStorage';

const IS_DEBUG = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.search.includes('debug=true')
);

interface DebugNotification {
  id: number;
  message: string;
}

interface UseDebugShortcutsOptions {
  goToMenu: () => void;
  goToShipSelect: () => void;
  setGodMode?: (enabled: boolean) => void;
}

let notifId = 0;

export const useDebugShortcuts = (options: UseDebugShortcutsOptions) => {
  const [notifications, setNotifications] = useState<DebugNotification[]>([]);
  const [godMode, setGodMode] = useState(false);

  const showNotif = useCallback((message: string) => {
    const id = ++notifId;
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 2000);
  }, []);

  useEffect(() => {
    if (!IS_DEBUG) return;

    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      // Ctrl+Shift+R: Reset ALL progress
      if (e.shiftKey && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault();
        saveGallery({ gameover: false, victory: false, secret: false, newUnlocks: [] });
        saveEasterEgg({ codeEntered: false });
        localStorage.removeItem('2500km-bestscore');
        options.goToMenu();
        showNotif('All Progress Reset');
        return;
      }

      switch (e.key) {
        case 'r': {
          e.preventDefault();
          options.goToShipSelect();
          showNotif('Game Reset');
          break;
        }
        case '1': {
          e.preventDefault();
          unlockEnding('gameover');
          showNotif('Ending 1 Unlocked');
          break;
        }
        case '2': {
          e.preventDefault();
          unlockEnding('victory');
          showNotif('Ending 2 Unlocked');
          break;
        }
        case '3': {
          e.preventDefault();
          unlockEnding('secret');
          showNotif('Ending 3 Unlocked');
          break;
        }
        case 'g': {
          e.preventDefault();
          setGodMode(prev => {
            const next = !prev;
            showNotif(`God Mode: ${next ? 'ON' : 'OFF'}`);
            return next;
          });
          break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options, showNotif]);

  return { notifications, godMode, isDebugEnabled: IS_DEBUG };
};
