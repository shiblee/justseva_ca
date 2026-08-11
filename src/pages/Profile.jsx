import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { Grid, User as UserIcon, MessageSquare, HelpCircle, LogOut, FileText, Bell, Heart, MapPin } from 'lucide-react';
import LogoutModal from '../components/LogoutModal';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', email: '', created_at: '' });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLogoutModalOpen(false);
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Jul 2026';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Jul 2026';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="profile-page">
      <TopBar />
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <img 
            src={user.profile_url || user.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`} 
            alt={user.name} 
            className="profile-avatar" 
            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`; e.target.onerror = null; }}
          />
        </div>
        <h1 className="profile-name">{user.name || 'User Name'}</h1>
        <p className="profile-email">{user.email || user.username || user.mobile || user.phone || ''}</p>
        <p className="profile-member-since">Member since {formatDate(user.created_at)}</p>
      </div>

      <div className="profile-content">
        <button className="browse-services-btn" onClick={() => navigate('/dashboard')}>
          <div className="btn-left">
            <Grid size={20} />
            <span>Browse Services</span>
          </div>
          <span className="btn-right animated-arrow">→</span>
        </button>

        <div className="profile-menu">
          <div className="menu-item" onClick={() => navigate('/my-orders')}>
            <div className="menu-icon-wrapper" style={{ backgroundColor: '#fef3c7' }}>
              <FileText size={20} color="#d97706" />
            </div>
            <div className="menu-text">
              <h4>Orders</h4>
            </div>
            <span className="menu-arrow">›</span>
          </div>

          <div className="menu-item" onClick={() => navigate('/notifications')}>
            <div className="menu-icon-wrapper" style={{ backgroundColor: '#e0e7ff' }}>
              <Bell size={20} color="#4f46e5" />
            </div>
            <div className="menu-text">
              <h4>Notifications</h4>
            </div>
            <span className="menu-arrow">›</span>
          </div>

          <div className="menu-item" onClick={() => navigate('/favorites')}>
            <div className="menu-icon-wrapper" style={{ backgroundColor: '#fce7f3' }}>
              <Heart size={20} color="#db2777" />
            </div>
            <div className="menu-text">
              <h4>Favorites</h4>
            </div>
            <span className="menu-arrow">›</span>
          </div>

          <div className="menu-item" onClick={() => navigate('/add-address?redirect=/profile')}>
            <div className="menu-icon-wrapper" style={{ backgroundColor: '#dcfce7' }}>
              <MapPin size={20} color="#16a34a" />
            </div>
            <div className="menu-text">
              <h4>Saved Addresses</h4>
            </div>
            <span className="menu-arrow">›</span>
          </div>

          <div className="menu-item" onClick={() => navigate('/edit-profile')}>
            <div className="menu-icon-wrapper" style={{ backgroundColor: '#f1f5f9' }}>
              <UserIcon size={20} color="#64748b" />
            </div>
            <div className="menu-text">
              <h4>Edit Profile</h4>
            </div>
            <span className="menu-arrow">›</span>
          </div>

          <div className="menu-item" onClick={() => navigate('/testimonial')}>
            <div className="menu-icon-wrapper" style={{ backgroundColor: '#ecfdf5' }}>
              <MessageSquare size={20} color="#10b981" />
            </div>
            <div className="menu-text">
              <h4>Testimonials</h4>
            </div>
            <span className="menu-arrow">›</span>
          </div>



          <div className="menu-item" onClick={() => navigate('/support')}>
            <div className="menu-icon-wrapper" style={{ backgroundColor: '#eff6ff' }}>
              <HelpCircle size={20} color="#3b82f6" />
            </div>
            <div className="menu-text">
              <h4>Contact Support</h4>
            </div>
            <span className="menu-arrow">›</span>
          </div>

          <div className="menu-item" onClick={handleLogout}>
            <div className="menu-icon-wrapper" style={{ backgroundColor: '#fff1f2' }}>
              <LogOut size={20} color="#e50942" />
            </div>
            <div className="menu-text">
              <h4 style={{ color: '#e50942' }}>Logout</h4>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={confirmLogout} 
      />
    </div>
  );
};

export default Profile;
