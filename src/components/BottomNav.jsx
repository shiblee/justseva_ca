import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Bell, User } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: <Home size={20} />, label: 'Home' },
    { path: '/my-orders', icon: <FileText size={20} />, label: 'Orders' },
    { path: '/notifications', icon: <Bell size={20} />, label: 'Notifications' },
    { path: '/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  return (
    <div className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path === '/profile' && ['/favorites', '/edit-profile', '/add-address', '/testimonial', '/support'].includes(location.pathname));
        return (
          <div 
            key={item.label} 
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <div className="nav-icon">{item.icon}</div>
            <span className="nav-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default BottomNav;
