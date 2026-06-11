// ============================================================================
// useSoundEffects.ts
// Hook tạo TOÀN BỘ âm thanh game bằng Web Audio API — KHÔNG dùng file mp3/wav.
// Mỗi tiếng động được "tổng hợp" trực tiếp bằng oscillator + noise buffer
// → file nhẹ, không cần asset, đậm chất retro/8-bit "goofy".
// ============================================================================
import { useCallback, useRef } from 'react';

// Hook chính: trả về object chứa các hàm phát âm thanh, được Game.tsx gọi
// tại đúng thời điểm xảy ra sự kiện (di chuyển, va chạm, nổ, thắng, thua...).
export const useSoundEffects = () => {
  // Giữ 1 AudioContext duy nhất xuyên suốt vòng đời component (lazy-init).
  const audioContextRef = useRef<AudioContext | null>(null);

  // Lấy AudioContext — tạo mới nếu chưa có. Có fallback webkitAudioContext
  // cho các trình duyệt Safari/iOS cũ.
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Tiếng "boing" ngắn khi tàu di chuyển — sóng sine quét tần số 300→600→200Hz.
  const playMoveSound = useCallback(() => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }, [getAudioContext]);

  // Tiếng "splat" khi va chạm — noise burst đi qua lowpass giảm dần
  // tạo cảm giác "bụp" trầm như đụng vào kim loại.
  const playCollisionSound = useCallback(() => {
    const ctx = getAudioContext();
    
    // Tạo buffer nhiễu trắng dài 0.3s, biên độ giảm dần theo hàm mũ.
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Lowpass quét từ 1000Hz xuống 100Hz để âm "trầm dần".
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(ctx.currentTime);
  }, [getAudioContext]);

  // Tiếng "whoosh" khi né được vật cản — sawtooth quét xuống nhanh.
  const playDodgeSound = useCallback(() => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }, [getAudioContext]);

  // Tiếng "pop" khi khiên (shield) vỡ — kết hợp 2 oscillator square + triangle
  // chồng lên nhau để tạo âm "rạn nứt" có chiều sâu.
  const playShieldBreakSound = useCallback(() => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(400, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.25);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    
    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.25);
  }, [getAudioContext]);

  // Tiếng "ầm ầm" cảnh báo bão Terra — sawtooth tần số thấp 40-80Hz
  // qua lowpass 200Hz để tạo rung trầm 1.5 giây.
  const playStormSound = useCallback(() => {
    const ctx = getAudioContext();
    
    // Rung trầm (rumble).
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 1);
    
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
  }, [getAudioContext]);

  // Tiếng nổ khi sudden entity phát nổ — noise burst lớn + "bwop" sine
  // trầm chồng lên để mô phỏng tiếng "bùm-bụp".
  const playExplosionSound = useCallback(() => {
    const ctx = getAudioContext();
    
    // Noise burst nửa giây (nhiễu trắng giảm dần).
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    // Lớp "bwop" sine trầm chồng lên để có chiều sâu.
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
    
    oscGain.gain.setValueAtTime(0.3, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    noise.start(ctx.currentTime);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }, [getAudioContext]);

  // 3 tiếng "beep beep beep" cảnh báo có vật thể đang lao tới —
  // tần số tăng dần (800, 1000, 1200Hz) để tạo cảm giác khẩn cấp.
  const playIncomingSound = useCallback(() => {
    const ctx = getAudioContext();
    
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.value = 800 + i * 200;
      
      const startTime = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);
      
      osc.start(startTime);
      osc.stop(startTime + 0.08);
    }
  }, [getAudioContext]);

  // Fanfare bắt đầu game — đánh hợp âm C trưởng (C-E-G-C cao).
  const playStartSound = useCallback(() => {
    const ctx = getAudioContext();
    const notes = [262, 330, 392, 523]; // C E G C
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }, [getAudioContext]);

  // Giai điệu "kèn buồn" khi game over (G - Gb - F - C đi xuống).
  const playGameOverSound = useCallback(() => {
    const ctx = getAudioContext();
    const notes = [392, 370, 349, 262]; // G Gb F C
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + i * 0.3;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.setValueAtTime(0.15, startTime + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }, [getAudioContext]);

  // Fanfare chiến thắng — chuỗi 6 nốt đi lên rộn ràng (C E G C G C).
  const playVictorySound = useCallback(() => {
    const ctx = getAudioContext();
    const notes = [523, 659, 784, 1047, 784, 1047]; // C E G C G C
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }, [getAudioContext]);

  // Export toàn bộ hàm phát âm thanh để các component khác dùng.
  return {
    playMoveSound,
    playCollisionSound,
    playDodgeSound,
    playShieldBreakSound,
    playStormSound,
    playExplosionSound,
    playIncomingSound,
    playStartSound,
    playGameOverSound,
    playVictorySound,
  };
};
