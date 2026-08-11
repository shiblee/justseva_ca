import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut } from 'lucide-react';
import './LogoutModal.css';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content logout-modal">
        <div className="modal-icon-wrapper">
          <LogOut size={32} color="#E50942" />
        </div>
        <h2 className="modal-title">Logging out?</h2>
        <p className="modal-subtitle">You will be signed out of your account.</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-confirm-logout" onClick={onConfirm}>
            <LogOut size={16} /> Yes, Logout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LogoutModal;
