import { useState, useCallback, useRef } from 'react';

export function useAudio() {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('deception_game_muted') === 'true';
  });

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('deception_game_muted', String(next));
      return next;
    });
  }, []);

  /**
   * صوت النقر البسيط على الأزرار
   */
  const playClick = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Ignore audio context autoplay errors
    }
  }, [isMuted, getAudioContext]);

  /**
   * صوت نبضات المؤقت عند اقتراب انتهاء الوقت
   */
  const playTimerTick = useCallback((urgent = false) => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = urgent ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(urgent ? 750 : 350, ctx.currentTime);

      gain.gain.setValueAtTime(urgent ? 0.2 : 0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (urgent ? 0.08 : 0.04));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (urgent ? 0.08 : 0.04));
    } catch (e) {}
  }, [isMuted, getAudioContext]);

  /**
   * نغمة الإجابة الصحيحة السرية (Major Arpeggio)
   */
  const playCorrect = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
      });
    } catch (e) {}
  }, [isMuted, getAudioContext]);

  /**
   * نغمة تسجيل الخدعة أو الإجابة المزيفة
   */
  const playBluffSecret = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [400, 320, 480, 260];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);

        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.09 + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.2);
      });
    } catch (e) {}
  }, [isMuted, getAudioContext]);

  /**
   * صوت تسجيل التصويت
   */
  const playVote = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }, [isMuted, getAudioContext]);

  /**
   * صوت الاحتفال والفوز (Fanfare)
   */
  const playVictoryFanfare = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5];
      const times = [0, 0.12, 0.24, 0.36, 0.48, 0.65];
      const durations = [0.1, 0.1, 0.1, 0.1, 0.15, 0.5];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + times[idx]);

        gain.gain.setValueAtTime(0.15, ctx.currentTime + times[idx]);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + times[idx] + durations[idx]);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + times[idx]);
        osc.stop(ctx.currentTime + times[idx] + durations[idx]);
      });
    } catch (e) {}
  }, [isMuted, getAudioContext]);

  return {
    isMuted,
    toggleMute,
    playClick,
    playTimerTick,
    playCorrect,
    playBluffSecret,
    playVote,
    playVictoryFanfare,
  };
}
