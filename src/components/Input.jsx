import React from 'react';
import './Input.css';

const Input = ({ icon, label, placeholder, value, onChange, type = 'text', style, maxLength, disabled, multiline, rows = 3 }) => {
  const displayLabel = label || placeholder;
  return (
    <div className={`input-wrapper ${disabled ? 'disabled' : ''} ${multiline ? 'textarea' : ''} ${!icon ? 'no-icon' : ''}`} style={style}>
      {icon && <div className="input-icon">{icon}</div>}
      <div className="input-container">
        {multiline ? (
          <textarea
            className="input-field textarea"
            placeholder=" "
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            disabled={disabled}
            rows={rows}
          />
        ) : (
          <input
            type={type}
            className="input-field"
            placeholder=" "
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            disabled={disabled}
          />
        )}
        {displayLabel && <label className="input-label">{displayLabel}</label>}
      </div>
    </div>
  );
};

export default Input;
