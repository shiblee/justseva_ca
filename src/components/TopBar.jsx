import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutModal from './LogoutModal';
import ActionRequiredBanner from './ActionRequiredBanner';
import RatingPromptModal from './RatingPromptModal';
import { logoutUser } from '../services/api';
import './TopBar.css';

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    if (token) {
      try {
        await logoutUser(token);
      } catch (err) {
        console.error('Logout failed:', err);
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userLocation');
    setIsLogoutModalOpen(false);
    navigate('/login');
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="JustSeva Logo" className="topbar-logo-img" />
        </div>
        <div className="topbar-actions">
          {token ? (
            <>

              <button className="icon-btn" onClick={handleLogoutClick} title="Logout">
                <LogOut size={20} />
              </button>
            </>
          ) : location.pathname !== '/login' ? (
            <button className="signin-btn" onClick={() => navigate('/login')}>
              <User size={16} />
              Sign In
            </button>
          ) : null}
        </div>

        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={confirmLogout}
        />
      </div>
      <ActionRequiredBanner />
      <RatingPromptModal />
    </>
  );
};

export default TopBar;
