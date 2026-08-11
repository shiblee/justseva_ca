import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './PageHeader.css';

// Common "back + title (+ badge)" row used below TopBar on every non-root page,
// so every page in the app shares the same section-header look.
const PageHeader = ({ title, subtitle, badge, onBadgeClick, onBack, showBack = true }) => {
  const navigate = useNavigate();

  return (
    <div className="page-header">
      {showBack && (
        <div className="page-header-back" onClick={onBack || (() => navigate(-1))}>
          <ChevronLeft size={24} />
        </div>
      )}
      <div className="page-header-text">
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      {(badge || badge === 0) && (
        <div className="page-header-badge" onClick={onBadgeClick} style={onBadgeClick ? { cursor: 'pointer' } : undefined}>
          {badge}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
