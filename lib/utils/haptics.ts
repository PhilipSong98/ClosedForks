/**
 * Haptic feedback utilities for mobile devices
 * Uses the Vibration API when available
 */

export const haptic = {
  /** Light tap feedback (10ms) - for button taps */
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
  },

  /** Medium feedback (25ms) - for confirmations */
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(25)
    }
  },

  /** Success pattern - for completed actions */
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 20])
    }
  },

  /** Error pattern - for failed actions */
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50])
    }
  }
}
