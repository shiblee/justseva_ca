import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', onClick, disabled, style }) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
};

export default Button;
