const STORAGE_KEY = '25000km-gallery';

export interface GalleryData {
  gameover: boolean;
  victory: boolean;
  secret: boolean;
  newUnlocks: string[]; // endings unlocked this session but not yet seen in gallery
}

const DEFAULT: GalleryData = { gameover: false, victory: false, secret: false, newUnlocks: [] };

export const loadGallery = (): GalleryData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT, ...parsed };
  } catch {
    return { ...DEFAULT };
  }
};

export const saveGallery = (data: GalleryData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const unlockEnding = (ending: 'gameover' | 'victory' | 'secret'): GalleryData => {
  const data = loadGallery();
  if (!data[ending]) {
    data[ending] = true;
    data.newUnlocks = [...new Set([...data.newUnlocks, ending])];
    saveGallery(data);
  }
  return data;
};

export const clearNewUnlock = (ending: string): GalleryData => {
  const data = loadGallery();
  data.newUnlocks = data.newUnlocks.filter(e => e !== ending);
  saveGallery(data);
  return data;
};
