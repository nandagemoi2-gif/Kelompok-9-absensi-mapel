export const pushNotificationService = {
  /**
   * Request native browser notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  },

  /**
   * Send native push notification
   */
  sendNotification(title: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      } catch (err) {
        console.warn('Native notification suppressed or not supported:', err);
      }
    }
  },

  /**
   * Play synthesizer audio chime (No external audio asset required)
   */
  playAudioCue(type: 'success' | 'warning' | 'error' | 'bell'): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (type === 'success') {
        // High crisp pleasant dual chime (E5 -> B5)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc1.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.15); // B5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.05); // E6

        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start(ctx.currentTime + 0.05);
        osc1.stop(ctx.currentTime + 0.35);
        osc2.stop(ctx.currentTime + 0.35);
      } else if (type === 'warning' || type === 'error') {
        // Buzz tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'bell') {
        // School bell tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch {
      // AudioContext not allowed before user gesture or not supported
    }
  },

  /**
   * Trigger haptic vibration if available on mobile
   */
  vibrate(pattern: number | number[] = 100): void {
    if ('navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore vibration error
      }
    }
  },
};
