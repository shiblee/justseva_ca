import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import { getCategoryDetails, searchServices, toggleFavorite, LEGACY_ASSETS_BASE_URL } from '../services/api';
import { Search, ChevronRight, Star, Heart, Briefcase, Users } from 'lucide-react';
import './Category.css';

const Category = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ category: null, subcategories: [], allCategories: [] });
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const responseData = await getCategoryDetails(id, token);
        setData(responseData);
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

    fetchCategory();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="category-page loading">
        <TopBar />
        <div className="loading-spinner">Loading category...</div>
      </div>
    );
  }

  const { category, subcategories } = data;

  const handleFavoriteToggle = async (e, serviceId, index) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      // Optimistic UI update
      const newSubcategories = [...subcategories];
      newSubcategories[index] = {
        ...newSubcategories[index],
        is_favorite: !newSubcategories[index].is_favorite
      };
      setData({ ...data, subcategories: newSubcategories });

      await toggleFavorite(serviceId, token);
    } catch (err) {
      console.error(err);
      // Revert if error
      const newSubcategories = [...subcategories];
      newSubcategories[index] = {
        ...newSubcategories[index],
        is_favorite: !newSubcategories[index].is_favorite
      };
      setData({ ...data, subcategories: newSubcategories });
    }
  };

  return (
    <div className="category-page">
      <TopBar />
      
      <div className="category-content">
        {error && <div className="error-banner">{error}</div>}

        <div className="search-bar-container" style={{ position: 'relative', marginBottom: '24px' }}>
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
                      onClick={() => {
                        setShowSearchDropdown(false);
                        navigate(`/category/${res.category_id}`);
                      }}
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

        {/* Top Header Categories Slider */}
        <div className="category-slider">
          {data.allCategories && data.allCategories.map(cat => (
            <div 
              key={cat.id} 
              className={`slider-item ${cat.id === category?.id ? 'active' : ''}`}
              onClick={() => navigate(`/category/${cat.id}`)}
            >
              <div className="slider-image-wrapper">
                <img src={`${LEGACY_ASSETS_BASE_URL}/uploads/category/${cat.image}`} alt={cat.name} />
              </div>
              <span className="slider-name">{cat.name}</span>
            </div>
          ))}
        </div>

        <div className="breadcrumbs">
          <span onClick={() => navigate('/dashboard')}>Home</span>
          <ChevronRight size={14} color="#94a3b8" />
          <span className="current">{category?.name}</span>
        </div>

        <PageHeader title={category?.name} badge={`${subcategories.length} Services`} />

        <div className="services-grid">
          {subcategories && subcategories.length > 0 ? (
            subcategories.map((service, index) => (
              <div key={service.id} className="service-card">
                <div className="service-image-wrapper">
                  <img src={`${LEGACY_ASSETS_BASE_URL}/uploads/sub-category/${service.image}`} alt={service.name} className="service-image" />
                  <div className="service-rating">
                    <Star size={12} fill="white" color="white" /> <span>0.0</span>
                  </div>
                  <div className="service-favorite" onClick={(e) => handleFavoriteToggle(e, service.id, index)}>
                    <Heart size={16} color={service.is_favorite ? "#e50942" : "#94a3b8"} fill={service.is_favorite ? "#e50942" : "none"} />
                  </div>
                  {service.total_partners === 0 && (
                    <div className="coming-soon-overlay">
                      <span className="coming-soon-badge">Coming Soon</span>
                    </div>
                  )}
                </div>
                
                <div className="service-info">
                  <h3 className="service-name">{service.name}</h3>
                  <div className="service-jobs">
                    <Users size={14} color="#e50942" />
                    <span>{service.total_partners} Partners</span>
                  </div>
                  
                  {service.total_partners > 0 ? (
                    <button className="book-now-btn" onClick={() => navigate(`/book-service/${service.id}`)}>Book Now</button>
                  ) : (
                    <button className="coming-soon-btn" disabled>Coming Soon</button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-services">No connected services found.</div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Category;
