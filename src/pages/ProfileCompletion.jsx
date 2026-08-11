import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Input from '../components/Input';
import Button from '../components/Button';
import AddressAutocomplete from '../components/AddressAutocomplete';
import MapPreview from '../components/MapPreview';
import { User, MapPin, Building, Map as MapIcon, Hash, Phone, Navigation, Mail } from 'lucide-react';
import { completeProfile, sendProfileOtp, verifyProfileOtp } from '../services/api';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import './ProfileCompletion.css';

const ProfileCompletion = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Form State
  const [flat, setFlat] = useState('');
  const [area, setArea] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [addressType, setAddressType] = useState('Home');
  const [email, setEmail] = useState('');
  
  // OTP State
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [timer, setTimer] = useState(0);
  
  // Map State (Default to Lucknow)
  const [mapCenter, setMapCenter] = useState({ lat: 26.8467, lng: 80.9462 });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setFullName(parsed.name || '');
      
      if (parsed.username && parsed.username.includes('@')) {
        setEmail(parsed.username);
      } else if (parsed.email) {
        setEmail(parsed.email);
      }
      
      // If username doesn't contain '@', it's a mobile login
      if (parsed.username && !parsed.username.includes('@')) {
        setMobileNumber(parsed.username);
        setIsMobileVerified(true);
      }
    } else {
      navigate('/login');
    }

    // Auto-fill address if location exists
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      const { latitude, longitude } = JSON.parse(storedLocation);
      reverseGeocode(latitude, longitude);
    }
  }, [navigate]);

  const handlePlaceSelect = (place) => {
    if (!place || !place.address_components) return;
    
    let parsedCity = '';
    let parsedState = '';
    let parsedPinCode = '';
    let parsedArea = place.name || ''; // Fallback for area

    place.address_components.forEach(component => {
      const types = component.types;
      if (types.includes('locality')) {
        parsedCity = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        parsedState = component.long_name;
      }
      if (types.includes('postal_code')) {
        parsedPinCode = component.long_name;
      }
      if (types.includes('sublocality') || types.includes('neighborhood')) {
        parsedArea = component.long_name;
      }
    });

    if (parsedCity) setCity(parsedCity);
    if (parsedState) setState(parsedState);
    if (parsedPinCode) setPinCode(parsedPinCode);
    if (parsedArea) setArea(parsedArea);
    
    // Set the text box value automatically (short building/street name - city/state/pincode are captured separately above)
    const displayName = place.descriptionFallback || place.name || parsedArea || place.formatted_address;
    if (displayName) setFlat(displayName);
    
    if (place.geometry && place.geometry.location) {
      const lat = typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat;
      const lng = typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng;
      localStorage.setItem('userLocation', JSON.stringify({ latitude: lat, longitude: lng }));
      setMapCenter({ lat, lng });
    }
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const place = data.results[0];
          handlePlaceSelect(place);
          return;
        }
      }
      
      // Fallback to OpenStreetMap
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      if (data && data.address) {
        setCity(data.address.city || data.address.town || data.address.village || '');
        setState(data.address.state || '');
        setPinCode(data.address.postcode || '');
        setArea(data.address.suburb || data.address.neighbourhood || '');
        
        // Update the text box for OSM fallback (short area name, not the full display_name)
        const displayName = data.address.suburb || data.address.neighbourhood || data.display_name;
        if (displayName) setFlat(displayName);
      }
    } catch (err) {
      console.error('Failed to reverse geocode', err);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const permStatus = await Geolocation.requestPermissions();
        if (permStatus.location === 'granted') {
          const position = await Geolocation.getCurrentPosition();
          const { latitude, longitude } = position.coords;
          localStorage.setItem('userLocation', JSON.stringify({ latitude, longitude }));
          setMapCenter({ lat: latitude, lng: longitude });
          reverseGeocode(latitude, longitude);
        } else {
          alert('Could not get location. Please ensure location permissions are granted.');
        }
      } else {
        // Fallback for Web Browser
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            localStorage.setItem('userLocation', JSON.stringify({ latitude, longitude }));
            setMapCenter({ lat: latitude, lng: longitude });
            reverseGeocode(latitude, longitude);
          },
          (error) => {
            console.error('Error getting location via navigator:', error);
            alert('Error fetching location. Please ensure location permissions are enabled in your browser.');
          }
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Error fetching location.');
    }
  };

  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      setErrors(prev => ({ ...prev, mobileNumber: 'Please enter a valid 10-digit mobile number.' }));
      return;
    }
    if (otpSent && resendCount >= 2) return;
    setLoading(true);
    setApiError('');
    setErrors(prev => ({ ...prev, mobileNumber: null }));
    try {
      const token = localStorage.getItem('token');
      await sendProfileOtp(mobileNumber, token);
      if (otpSent) {
        setResendCount(prev => prev + 1);
      }
      setOtpSent(true);
      setTimer(30);
    } catch (err) {
      setApiError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setErrors(prev => ({ ...prev, otp: 'Please enter a valid 6-digit OTP.' }));
      return;
    }
    setVerifying(true);
    setApiError('');
    setErrors(prev => ({ ...prev, otp: null }));
    try {
      const token = localStorage.getItem('token');
      await verifyProfileOtp(mobileNumber, otp, token);
      setIsMobileVerified(true);
      setOtpSent(false);
    } catch (err) {
      setApiError(err.message || 'Failed to verify OTP.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!flat) newErrors.flat = 'Please search and select your building/area.';
    if (!fullName) newErrors.fullName = 'Full Name is required.';
    if (!mobileNumber) newErrors.mobileNumber = 'Mobile Number is required.';
    else if (!isMobileVerified) newErrors.mobileNumber = 'Please verify your mobile number via OTP.';
    if (!isGoogleLogin && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    setApiError('');
    try {
      const token = localStorage.getItem('token');
      const profileData = { fullName, mobileNumber, flat, area, pinCode, city, state, addressType, email: isGoogleLogin ? undefined : email };
      const response = await completeProfile(profileData, token);
      
      if (response.user) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...response.user }));
      }
      
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.message || 'Failed to complete profile.');
    } finally {
      setLoading(false);
    }
  };

  const isGoogleLogin = user?.username?.includes('@');

  return (
    <div className="pc-profile-page">
      <TopBar />

      <div className="pc-profile-header">
        {user?.profile_url && (
          <img
            src={user.profile_url}
            alt="Google Profile"
            className="pc-profile-avatar"
            style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px', border: '3px solid #ffffff', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', display: 'block' }}
          />
        )}
        <h1 className="profile-title">Complete Your Profile</h1>
        <p className="profile-subtitle">Just a few more details to get you started on JustSeva.</p>
      </div>

      <div className="profile-container">
        
        {apiError && <div className="error-banner">{apiError}</div>}

        <div className="profile-card">
          <div className="card-header">
            <div className="card-icon-wrapper">
              <MapPin className="card-icon" />
            </div>
            <h2>Location Details</h2>
          </div>
          
          <MapPreview lat={mapCenter.lat} lng={mapCenter.lng} />

          <div className="location-btn-wrapper" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="use-location-btn" onClick={handleUseCurrentLocation}>
              <Navigation size={14} />
              Auto-detect
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <AddressAutocomplete 
                icon={<Building size={18} />} 
                label="Search Building / Area *" 
                value={flat} 
                onChange={(val) => {
                  setFlat(val);
                  if (errors.flat) setErrors(prev => ({ ...prev, flat: null }));
                }} 
                onSelect={(place) => {
                  handlePlaceSelect(place);
                  if (errors.flat) setErrors(prev => ({ ...prev, flat: null }));
                }}
              />
              {errors.flat && <div className="field-error">{errors.flat}</div>}
            </div>

            <div className="form-group full-width" style={{ marginTop: '-8px' }}>
              <label style={{ fontWeight: '800', color: '#334155', marginBottom: '12px', display: 'block', fontSize: '15px' }}>
                Save Address As <span style={{color: '#e50942'}}>*</span>
              </label>
              <div className="address-type-selector">
                {['Home', 'Work', 'Hotel', 'Other'].map(type => {
                  let icon = '📍';
                  if (type === 'Home') icon = '🏠';
                  if (type === 'Work') icon = '🏢';
                  if (type === 'Hotel') icon = '🏨';
                  
                  return (
                    <button
                      key={type}
                      className={`address-type-btn ${addressType === type ? 'active' : ''}`}
                      onClick={() => setAddressType(type)}
                    >
                      {icon} {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="card-header">
            <div className="card-icon-wrapper user-icon">
              <User className="card-icon" />
            </div>
            <h2>Personal Details</h2>
          </div>
          
          <div className="form-grid">
            <div className="form-group full-width">
              <Input 
                icon={<User size={18} />} 
                label="Full Name *" 
                value={fullName} 
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors(prev => ({ ...prev, fullName: null }));
                }} 
              />
              {errors.fullName && <div className="field-error">{errors.fullName}</div>}
            </div>

            {isGoogleLogin ? (
              email && (
                <div className="form-group full-width">
                  <Input
                    icon={<Mail size={18} />}
                    label="Email Address (from Google)"
                    value={email}
                    disabled={true}
                  />
                </div>
              )
            ) : (
              <div className="form-group full-width">
                <Input
                  icon={<Mail size={18} />}
                  label="Email Address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                  }}
                />
                {errors.email && <div className="field-error">{errors.email}</div>}
              </div>
            )}

            <div className="form-group full-width">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <Input 
                    icon={<Phone size={18} />} 
                    label="Mobile Number *" 
                    value={mobileNumber} 
                    onChange={(e) => {
                      setMobileNumber(e.target.value.replace(/\D/g, ''));
                      if (isMobileVerified) setIsMobileVerified(false);
                      if (errors.mobileNumber) setErrors(prev => ({ ...prev, mobileNumber: null }));
                    }}
                    maxLength={10} 
                    disabled={!isGoogleLogin || isMobileVerified} 
                  />
                </div>
                {isGoogleLogin && !isMobileVerified && !otpSent && (
                  <Button variant="outline" onClick={handleSendOtp} disabled={loading} style={{ height: '52px', padding: '0 24px', flexShrink: 0, width: 'auto' }}>
                    Verify
                  </Button>
                )}
                {isMobileVerified && (
                  <div style={{ height: '52px', display: 'flex', alignItems: 'center', color: '#10b981', fontWeight: 'bold' }}>
                    Verified ✓
                  </div>
                )}
              </div>
              {errors.mobileNumber && <div className="field-error">{errors.mobileNumber}</div>}
              
              {otpSent && !isMobileVerified && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Input 
                      icon={<Hash size={18} />} 
                      label="Enter OTP *" 
                      value={otp} 
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, ''));
                        if (errors.otp) setErrors(prev => ({ ...prev, otp: null }));
                      }}
                      maxLength={6} 
                    />
                  </div>
                  <Button variant="primary" onClick={handleVerifyOtp} disabled={verifying} style={{ height: '52px', padding: '0 24px', flexShrink: 0, width: 'auto' }}>
                    Confirm
                  </Button>
                </div>
              )}
              {otpSent && !isMobileVerified && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', padding: '0 4px' }}>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>
                    {timer > 0 ? `Resend OTP in 00:${timer.toString().padStart(2, '0')}` : "Didn't receive OTP?"}
                  </span>
                  
                  {timer === 0 && resendCount < 2 && (
                    <span style={{ color: '#E50942', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }} onClick={handleSendOtp}>
                      Resend
                    </span>
                  )}
                  {resendCount >= 2 && timer === 0 && (
                    <span style={{ fontSize: '13px', color: '#EF4444' }}>Max attempts reached</span>
                  )}
                </div>
              )}
              {errors.otp && <div className="field-error">{errors.otp}</div>}
            </div>
          </div>
        </div>

        <div className="submit-section">
          <Button variant="primary" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Saving details...' : 'Continue to Dashboard'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
