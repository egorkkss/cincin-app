// Утилита для работы с тактильной отдачей Telegram WebApp

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export const haptic = {
  light: () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  },
  medium: () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  },
  heavy: () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy');
  },
  notification: (type: 'error' | 'success' | 'warning') => {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
  },
  selection: () => {
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  }
};
