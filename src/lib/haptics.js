/**
 * Haptic feedback utility using the Web Vibration API.
 * Patterns are designed to provide clear sensory feedback for different outcomes.
 */
export const haptics = {
  /**
   * Short double pulse for success/correct answer.
   */
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 30, 40]);
    }
  },

  /**
   * Longer single pulse or distinct pattern for error/incorrect answer.
   */
  error: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  /**
   * Very light tap for interactions like selecting an option.
   */
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  },

  /**
   * Medium vibration for warnings or significant actions.
   */
  medium: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }
};
