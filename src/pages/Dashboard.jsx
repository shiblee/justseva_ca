import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';

import BottomNav from '../components/BottomNav';
import { getDashboardData, searchServices, LEGACY_ASSETS_BASE_URL } from '../services/api';
import { MapPin, ChevronRight, Search, Clock, ShieldCheck, Star, Briefcase, Users } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState({
    address: null,
    categories: [],
    refundRequests: []
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const dashboardData = await getDashboardData(token);
        setData(dashboardData);
      } catch (err) {
        setError(err.message);
        if (err.message === 'Token expired or invalid') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const renderAddress = () => {
    if (!data.address) return 'Please set your location';
    
    // Collect non-empty parts and map them to strings
    const rawParts = [
      data.address.flat, 
      data.address.area_locality || data.address.area, 
      data.address.city,
      data.address.state,
      data.address.pin || data.address.pincode
    ].filter(Boolean).map(s => String(s).trim());
    
    // Deduplicate exact matches
    let parts = [...new Set(rawParts)];
    
    // If the largest part contains other parts, filter out the smaller redundant parts
    const longestPart = parts.reduce((a, b) => a.length > b.length ? a : b, '');
    
    if (longestPart.length > 20) {
      parts = parts.filter(part => {
        if (part === longestPart) return true;
        // If the longest part contains this smaller part (e.g. "Lucknow"), filter it out
        if (longestPart.toLowerCase().includes(part.toLowerCase())) return false;
        return true;
      });
    }
    return parts.join(', ');
  };
    
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const token = localStorage.getItem('token');
          const results = await searchServices(searchQuery, token);
          setSearchResults(results);
          setShowSearchDropdown(true);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Click outside listener could be added here, but for now we'll just close on empty string

  if (loading) {
    return (
      <div className="dashboard-page loading">
        <TopBar />
        <div className="loading-spinner">Loading your services...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <TopBar />
      
      <div className="dashboard-content">
        {error && <div className="error-banner">{error}</div>}

        {/* Location & Search Header */}
        <div className="dashboard-header">
          <div className="location-bar" onClick={() => {
            if (data.address && data.address.id) {
              navigate(`/add-address?edit=true&id=${data.address.id}`);
            } else {
              navigate('/add-address');
            }
          }} style={{ cursor: 'pointer' }}>
            <div className="location-icon">
              <MapPin size={20} color="#e50942" />
            </div>
            <div className="location-details">
              <span className="location-label">YOUR LOCATION</span>
              <span className="location-text">{renderAddress()}</span>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </div>

          <div className="search-bar-container" style={{ position: 'relative' }}>
            <div className="search-bar" style={{ marginBottom: 0 }}>
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Search for a service (e.g. Electrician, Cleaning)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true) }}
              />
              {searchQuery && (
                <div 
                  className="clear-search-btn" 
                  onClick={() => setSearchQuery('')}
                  style={{ padding: '4px', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </div>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showSearchDropdown && (
              <div className="search-dropdown" style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                zIndex: 100,
                overflow: 'hidden',
                border: '1px solid #f1f5f9'
              }}>
                <div style={{ padding: '16px 20px 8px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>
                  SERVICES
                </div>
                {isSearching ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className="search-results-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {searchResults.map(res => (
                      <div 
                        key={res.id} 
                        className="search-result-item" 
                        onClick={() => navigate(`/category/${res.category_id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 20px',
                          gap: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: '#f8fafc',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <img 
                            src={`${LEGACY_ASSETS_BASE_URL}/uploads/sub-category/${res.image}`}
                            alt={res.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { 
                              e.target.style.display = 'none'; 
                              e.target.parentElement.innerHTML = '<span style="color:#94a3b8;font-size:12px;font-weight:bold;">'+res.name.substring(0,2).toUpperCase()+'</span>';
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ 
                            margin: '0', 
                            fontSize: '0.95rem', 
                            fontWeight: 700, 
                            color: '#1e293b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>{res.name}</h4>
                        </div>
                        <div style={{
                          background: '#fff1f2',
                          color: '#e50942',
                          padding: '5px 10px',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {res.category_name}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.95rem' }}>
                    No services found for "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <div className="dashboard-hero">
          <div className="hero-content">
            <h1>Home Services on Demand</h1>
            <p>Book expert professionals at your doorstep.</p>
          </div>
          <div className="hero-features">
            <div className="feature"><ShieldCheck size={16}/> Verified Pros</div>
            <div className="feature"><Clock size={16}/> Quick Booking</div>
            <div className="feature"><Star size={16}/> Rated Service</div>
          </div>
        </div>

        {/* Refund Alerts */}
        {data.refundRequests && data.refundRequests.length > 0 && (
          <div className="refund-alerts">
            {data.refundRequests.map(refund => (
              <div key={refund.refund_id} className="refund-card">
                <h4>Refund Initiated - {refund.order_no}</h4>
                <p>{refund.category_name} service refund is currently processing.</p>
              </div>
            ))}
          </div>
        )}

        {/* Services Grid */}
        <div className="services-section">
          <div className="services-header-text">
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '24px' }}>Explore Services</h2>
          </div>
          <div className="categories-grid">
            {data.categories && data.categories.length > 0 ? (
              data.categories.map(category => (
                <div key={category.id} className="category-card" onClick={() => navigate(`/category/${category.id}`)}>
                  <div className="category-image-wrapper">
                    <img src={`${LEGACY_ASSETS_BASE_URL}/uploads/category/${category.image}`} alt={category.name} className="category-image" />
                  </div>
                  <div className="category-info">
                    <h3 className="category-name">{category.name}</h3>
                    <div className="category-actions">
                      <div className="category-jobs">
                        <Users size={14} color="#475569" />
                        <span>{category.total_partners || 0} Partners</span>
                      </div>
                      <div className="category-arrow-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-services">No services available right now.</div>
            )}
          </div>
        </div>

        {/* Floating WhatsApp Button */}
        <div className="whatsapp-floating-btn" onClick={() => window.open('https://wa.me/YOURNUMBER', '_blank')}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" width="24" height="24" />
          <span>Chat with us</span>
        </div>

      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
