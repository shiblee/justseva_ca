import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import { getFavorites, toggleFavorite, LEGACY_ASSETS_BASE_URL } from '../services/api';
import { Heart, Briefcase, Users, Star } from 'lucide-react';
import './Category.css'; // Reuse styles from category

const Favorites = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const data = await getFavorites(token);
        setFavorites(data);
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

    fetchFavorites();
  }, [navigate]);

  const handleFavoriteToggle = async (e, serviceId, index) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      // Optimistic UI update: remove from the list
      const newFavorites = [...favorites];
      newFavorites.splice(index, 1);
      setFavorites(newFavorites);

      await toggleFavorite(serviceId, token);
    } catch (err) {
      console.error(err);
      // We don't bother reverting here since it's hard to track removed items without full state reload,
      // but in production we'd want to reload or keep the removed item cached
    }
  };

  if (loading) {
    return (
      <div className="category-page loading">
        <TopBar />
        <div className="loading-spinner">Loading favorites...</div>
      </div>
    );
  }

  return (
    <div className="category-page">
      <TopBar />
      
      <div className="category-content">
        {error && <div className="error-banner">{error}</div>}

        <PageHeader title="Your Favorites" badge={`${favorites.length} Saved`} />

        <div className="services-grid">
          {favorites && favorites.length > 0 ? (
            favorites.map((service, index) => (
              <div key={service.favorite_id} className="service-card">
                <div className="service-image-wrapper">
                  <img src={`${LEGACY_ASSETS_BASE_URL}/uploads/sub-category/${service.image}`} alt={service.name} className="service-image" />
                  <div className="service-rating">
                    <Star size={12} fill="white" color="white" /> <span>0.0</span>
                  </div>
                  <div className="service-favorite" onClick={(e) => handleFavoriteToggle(e, service.id, index)}>
                    <Heart size={16} color="#e50942" fill="#e50942" />
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
                  <div style={{
                    background: '#fff1f2',
                    color: '#e50942',
                    padding: '5px 10px',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    marginTop: '8px',
                    display: 'inline-block'
                  }}>
                    {service.category_name}
                  </div>
                  
                  <div style={{ marginTop: '12px' }}>
                    {service.total_partners > 0 ? (
                      <button className="book-now-btn" onClick={() => navigate(`/book-service/${service.id}`)}>Book Now</button>
                    ) : (
                      <button className="coming-soon-btn" disabled>Coming Soon</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-services">You haven't saved any favorites yet.</div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Favorites;
