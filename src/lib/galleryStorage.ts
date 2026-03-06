const STORAGE_KEY = '25000km-gallery';
const EASTER_EGG_KEY = '25000km-easteregg';

export interface GalleryData {
  gameover: boolean;
  victory: boolean;
  secret: boolean;
  newUnlocks: string[];
}

export interface EasterEggData {
  codeEntered: boolean;
}

const DEFAULT: GalleryData = { gameover: false, victory: false, secret: false, newUnlocks: [] };
const DEFAULT_EGG: EasterEggData = { codeEntered: false };

export const loadEasterEgg = (): EasterEggData => {
  try {
    const raw = localStorage.getItem(EASTER_EGG_KEY);
    if (!raw) return { ...DEFAULT_EGG };
    return { ...DEFAULT_EGG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_EGG };
  }
};

export const saveEasterEgg = (data: EasterEggData) => {
  localStorage.setItem(EASTER_EGG_KEY, JSON.stringify(data));
};

export const isAllEndingsUnlocked = (data: GalleryData): boolean => {
  return data.gameover && data.victory && data.secret;
};

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
