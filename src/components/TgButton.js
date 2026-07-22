"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TgButton = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
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
    return ((0, jsx_runtime_1.jsx)("button", { onClick: handleClick, className: `tg-button ${className}`, ...props, children: children }));
};
exports.TgButton = TgButton;
