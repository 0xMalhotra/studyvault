/**
 * Haptic feedback utility using the Web Vibration API.
 * Includes visual/console fallbacks for desktop and iOS browsers.
 */
export const haptics = {
  vibrate: (pattern) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        const result = navigator.vibrate(pattern);
        if (!result) console.warn('Haptics: navigator.vibrate returned false. Check device state.');
      } catch (e) {
        console.error('Haptics: Error triggering vibration:', e);
      }
    } else {
      // Visual fallback or console notification for non-supported devices (like iOS/Desktop)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        console.info('Haptics: Vibration API not supported on iOS Safari.');
      }
    }
  },

  success: () => {
    console.log('Haptic: Success');
    haptics.vibrate([40, 30, 40]);
    haptics.visualFeedback('success');
  },

  error: () => {
    console.log('Haptic: Error');
    haptics.vibrate([100, 50, 100]);
    haptics.visualFeedback('error');
  },

  light: () => {
    haptics.vibrate(15);
  },

  medium: () => {
    console.log('Haptic: Medium');
    haptics.vibrate(50);
  },

  /**
   * Provides visual feedback as a fallback or reinforcement.
   */
  visualFeedback: (type) => {
    if (typeof document === 'undefined') return;
    
    // Add a temporary visual indicator to the body
    const effect = document.createElement('div');
    effect.style.position = 'fixed';
    effect.style.inset = '0';
    effect.style.pointerEvents = 'none';
    effect.style.zIndex = '9999';
    effect.style.transition = 'all 0.3s ease';
    effect.style.opacity = '0';
    
    if (type === 'success') {
      effect.style.boxShadow = 'inset 0 0 100px rgba(16, 185, 129, 0.1)';
    } else if (type === 'error') {
      effect.style.boxShadow = 'inset 0 0 100px rgba(239, 68, 68, 0.1)';
      // Add a tiny shake to the body
      document.body.style.transform = 'translateX(2px)';
      setTimeout(() => { document.body.style.transform = 'translateX(-2px)'; }, 50);
      setTimeout(() => { document.body.style.transform = 'translateX(0)'; }, 100);
    }

    document.body.appendChild(effect);
    
    // Animate
    requestAnimationFrame(() => {
      effect.style.opacity = '1';
      setTimeout(() => {
        effect.style.opacity = '0';
        setTimeout(() => effect.remove(), 300);
      }, 150);
    });
  }
};
