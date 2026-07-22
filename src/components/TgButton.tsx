import React from 'react';
import { haptic } from '../utils/haptic';

interface TgButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'light' | 'medium' | 'heavy' | 'success' | 'error';
  children: React.ReactNode;
}

export const TgButton: React.FC<TgButtonProps> = ({ 
  variant = 'light', 
  onClick, 
  children, 
  className = '', 
  ...props 
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Вызываем вибрацию в зависимости от типа кнопки
    if (variant === 'success' || variant === 'error') {
      haptic.notification(variant);
    } else {
      haptic[variant]();
    }
    
    // Вызываем оригинальный onClick, если он был передан
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button 
      onClick={handleClick} 
      className={`tg-button ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
