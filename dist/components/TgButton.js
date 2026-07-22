"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TgButton = void 0;
const react_1 = __importDefault(require("react"));
const haptic_1 = require("../utils/haptic");
const TgButton = ({ variant = 'light', onClick, children, className = '', ...props }) => {
    const handleClick = (e) => {
        if (variant === 'success' || variant === 'error') {
            haptic_1.haptic.notification(variant);
        }
        else if (variant === 'light' || variant === 'medium' || variant === 'heavy') {
            haptic_1.haptic[variant]();
        }
        if (onClick) {
            onClick(e);
        }
    };
    return (<button onClick={handleClick} className={`tg-button ${className}`} {...props}>
      {children}
    </button>);
};
exports.TgButton = TgButton;
