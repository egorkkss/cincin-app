// Утилита для работы с тактильной отдачей Telegram WebApp

export const haptic = {
  // Легкий отдача (при кликах, переключателях)
  light: () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  },
  
  // Средняя отдача (при подтверждении действий)
  medium: () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  },
  
  // Тяжелая отдача (для важных событий)
  heavy: () => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy');
  },

  // Уведомления (успех, ошибка, предупреждение)
  notification: (type: 'error' | 'success' | 'warning') => {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
  },

  // Вибрация при выборе элемента (скролл селекторов)
  selection: () => {
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  }
};
