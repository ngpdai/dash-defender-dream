// ============================================================================
// crazygames.ts — Wrapper an toàn cho CrazyGames SDK v3.
// LƯU Ý: SDK v3 dùng GETTER cho .game / .ad — nếu SDK chưa init thì việc
// TRUY CẬP property cũng throw. Vì vậy phải bọc toàn bộ trong try/catch,
// không chỉ bọc lời gọi hàm.
// ============================================================================

const callSafe = (label: string, fn: (sdk: any) => void) => {
  try {
    if (typeof window === 'undefined') return;
    const sdk = (window as any).CrazyGames?.SDK;
    if (!sdk) return;
    fn(sdk);
  } catch (err) {
    // Nuốt lỗi (ví dụ: sdkNotInitialized) để không crash game.
    console.warn(`[CrazyGames] ${label} skipped:`, (err as Error)?.message ?? err);
  }
};

export const notifyGameLoaded = () =>
  callSafe('sdkGameLoadingStop', (sdk) => sdk.game.sdkGameLoadingStop());

export const notifyGameplayStart = () =>
  callSafe('gameplayStart', (sdk) => sdk.game.gameplayStart());

export const notifyGameplayStop = () =>
  callSafe('gameplayStop', (sdk) => sdk.game.gameplayStop());

export const requestMidgameAd = () =>
  callSafe('requestAd(midgame)', (sdk) => sdk.ad.requestAd('midgame'));
