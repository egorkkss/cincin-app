"use strict";
// Утилита для работы с тактильной отдачей Telegram WebApp
Object.defineProperty(exports, "__esModule", { value: true });
exports.haptic = void 0;
exports.haptic = {
    light: () => {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    },
    medium: () => {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    },
    heavy: () => {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy');
    },
    notification: (type) => {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
    },
    selection: () => {
        window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    }
};
