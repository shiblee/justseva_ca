import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Geolocation } from '@capacitor/geolocation';
import './LoadingScreen.css';

const LoadingScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const requestLocation = async () => {
      try {
        const permStatus = await Geolocation.requestPermissions();
        if (permStatus.location === 'granted') {
          const position = await Geolocation.getCurrentPosition();
          const { latitude, longitude } = position.coords;
          localStorage.setItem('userLocation', JSON.stringify({ latitude, longitude }));
        } else {
          console.warn('Location permission denied.');
        }
      } catch (error) {
        console.error('Error getting location:', error);
      } finally {
        setTimeout(() => navigate('/login'), 1000);
      }
    };

    // Small delay to simulate splash screen before asking
    const timer = setTimeout(() => {
      requestLocation();
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="loading-screen">
      <div className="loading-logo-container">
        <img src="/logo.png" alt="JustSeva Logo" className="loading-logo-img" />
      </div>
      <div className="spinner"></div>
      <p style={{marginTop: '20px', color: '#666', fontSize: '14px'}}>Detecting Location...</p>
    </div>
  );
};

export default LoadingScreen;
