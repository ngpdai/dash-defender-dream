// ============================================================================
// crazygames.ts — Wrapper an toàn cho CrazyGames SDK v3.
// Mục đích: gọi SDK mà không crash nếu chạy ngoài môi trường CrazyGames
// (ví dụ: local dev, Android build, hoặc SDK chưa load xong).
// ============================================================================

// Kiểu tối giản cho SDK — tránh phụ thuộc @types của CrazyGames.
type CrazyGamesSDK = {
  game?: {
    sdkGameLoadingStop?: () => void;
    gameplayStart?: () => void;
    gameplayStop?: () => void;
  };
  ad?: {
    requestAd?: (type: 'midgame' | 'rewarded') => void;
  };
};

// Lấy SDK từ window nếu tồn tại.
const getSDK = (): CrazyGamesSDK | undefined => {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { CrazyGames?: { SDK?: CrazyGamesSDK } }).CrazyGames?.SDK;
};

// Wrapper an toàn — nuốt mọi lỗi để không ảnh hưởng gameplay.
const safeCall = (fn: (() => void) | undefined, label: string) => {
  try {
    fn?.();
  } catch (err) {
    console.warn(`[CrazyGames] ${label} failed:`, err);
  }
};

// Báo SDK biết game đã load xong (gọi 1 lần khi app mount).
export const notifyGameLoaded = () => {
  safeCall(getSDK()?.game?.sdkGameLoadingStop, 'sdkGameLoadingStop');
};

// Báo SDK biết người chơi bắt đầu 1 ván chơi.
export const notifyGameplayStart = () => {
  safeCall(getSDK()?.game?.gameplayStart, 'gameplayStart');
};

// Báo SDK biết ván chơi đã dừng (thua / thắng / về menu).
export const notifyGameplayStop = () => {
  safeCall(getSDK()?.game?.gameplayStop, 'gameplayStop');
};

// Yêu cầu quảng cáo giữa màn (midgame ad).
export const requestMidgameAd = () => {
  try {
    getSDK()?.ad?.requestAd?.('midgame');
  } catch (err) {
    console.warn('[CrazyGames] requestAd(midgame) failed:', err);
  }
};
