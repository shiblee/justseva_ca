import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import MapPreview from '../components/MapPreview';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { Building2, Home, MapPin, Loader2, Navigation, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { addAddress, getAddresses, deleteAddress, selectAddress, updateAddress } from '../services/api';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import './AddAddress.css';

const AddAddress = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const isEditMode = searchParams.get('edit') === 'true';
  const editId = searchParams.get('id');

  const [viewMode, setViewMode] = useState(isEditMode ? 'form' : 'list');

  const [locationDetails, setLocationDetails] = useState({
    flat: '',
    area: '',
    pinCode: '',
    city: '',
    state: '',
    addressType: ''
  });
  
  const [mapCenter, setMapCenter] = useState({ lat: 26.8467, lng: 80.9462 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressToDelete, setAddressToDelete] = useState(null);
  
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await getAddresses(token);
          if (res.addresses) {
            setSavedAddresses(res.addresses);
            
            if (res.addresses.length === 0 && !isEditMode) {
              setViewMode('form');
            }

            if (isEditMode && editId) {
              const addrToEdit = res.addresses.find(a => a.id.toString() === editId);
              if (addrToEdit) {
                const flatStr = addrToEdit.flat || '';
                const cityStr = addrToEdit.city || '';

                setLocationDetails({
                  flat: flatStr,
                  area: addrToEdit.area_locality || addrToEdit.area || '',
                  pinCode: addrToEdit.pin || '',
                  city: cityStr,
                  state: addrToEdit.state || '',
                  addressType: addrToEdit.save_as || addrToEdit.address_type || ''
                });

                const searchQuery = `${flatStr}, ${cityStr}`;
                if (searchQuery.length > 3) {
                  try {
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                    if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
                      const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`);
                      const geoData = await geoRes.json();
                      if (geoData.results && geoData.results.length > 0) {
                        const { lat, lng } = geoData.results[0].geometry.location;
                        setMapCenter({ lat, lng });
                      }
                    } else {
                      const osRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
                      const osData = await osRes.json();
                      if (osData && osData.length > 0) {
                        setMapCenter({ lat: parseFloat(osData[0].lat), lng: parseFloat(osData[0].lon) });
                      }
                    }
                  } catch (e) {
                    console.error('Geocoding failed for edit address:', e);
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchAddresses();

    if (!isEditMode && viewMode === 'form') {
      const storedLocation = localStorage.getItem('userLocation');
      if (storedLocation) {
        const { latitude, longitude } = JSON.parse(storedLocation);
        reverseGeocode(latitude, longitude);
      }
    }
  }, [isEditMode, editId]);

  const reverseGeocode = async (lat, lon) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey && apiKey !== 'YOUR_API_KEY_HERE') {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const place = data.results[0];
          handleAddressSelect(place);
          return;
        }
      }
      
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      if (data && data.address) {
        setLocationDetails(prev => ({
          ...prev,
          city: data.address.city || data.address.town || data.address.village || '',
          state: data.address.state || '',
          pinCode: data.address.postcode || '',
          area: data.address.suburb || data.address.neighbourhood || prev.area,
          flat: data.address.suburb || data.address.neighbourhood || data.display_name || prev.flat
        }));
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

  const handleAddressSelect = (place) => {
    if (!place || !place.address_components) return;
    
    let parsedCity = '';
    let parsedState = '';
    let parsedPinCode = '';
    let parsedArea = place.name || '';

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

    // Keep this short (building/street only) - city, state, pincode are already captured separately above.
    const displayName = place.descriptionFallback || place.name || parsedArea || place.formatted_address;

    setLocationDetails(prev => ({
      ...prev,
      city: parsedCity || prev.city,
      state: parsedState || prev.state,
      pinCode: parsedPinCode || prev.pinCode,
      area: parsedArea || prev.area,
      flat: displayName || prev.flat
    }));

    if (place.geometry && place.geometry.location) {
      const lat = typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat;
      const lng = typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng;
      localStorage.setItem('userLocation', JSON.stringify({ latitude: lat, longitude: lng }));
      setMapCenter({ lat, lng });
    }
  };

  const handleSaveAddress = async () => {
    if (!locationDetails.flat) {
      setError('Please search and select your building/area.');
      return;
    }
    if (!locationDetails.addressType) {
      setError('Please select an address type (Home, Work, etc.).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const dataToSave = { ...locationDetails };

      if (isEditMode && editId) {
        await updateAddress(editId, dataToSave, token);
      } else {
        await addAddress(dataToSave, token);
      }
      
      // Navigate back
      navigate(redirectUrl);
    } catch (err) {
      setError(err.message || 'Failed to save address.');
      setLoading(false);
    }
  };

  const handleSelectAddressCard = async (addrId) => {
    try {
      const token = localStorage.getItem('token');
      await selectAddress(addrId, token);
      navigate(redirectUrl);
    } catch (error) {
      console.error('Failed to select address:', error);
      alert('Could not select address. Please try again.');
    }
  };

  const handleDeleteAddress = async () => {
    if (!addressToDelete) return;
    try {
      await deleteAddress(addressToDelete.id, localStorage.getItem('token'));
      setSavedAddresses(prev => prev.filter(a => a.id !== addressToDelete.id));
      if (savedAddresses.length <= 1) {
        setViewMode('form');
      }
      setAddressToDelete(null);
    } catch (err) {
      alert('Failed to delete address: ' + err.message);
    }
  };

  const renderFormView = () => (
    <div className="profile-container">
      {error && <div className="error-banner">{error}</div>}

      <div className="profile-card map-form-card">
        <MapPreview lat={mapCenter.lat} lng={mapCenter.lng} />

        <div className="location-btn-wrapper" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button className="use-location-btn" onClick={handleUseCurrentLocation}>
            <Navigation size={14} />
            Auto-detect
          </button>
        </div>

        <div className="form-group address-search-group">
          <AddressAutocomplete
            onSelect={handleAddressSelect}
            placeholder="Search Building / Area *"
            value={locationDetails.flat}
            onChange={(val) => setLocationDetails(prev => ({ ...prev, flat: val }))}
          />
        </div>

        <div className="address-type-section">
          <label className="type-label">Save Address As <span className="required" style={{color: '#e50942'}}>*</span></label>
          <div className="type-buttons">
            <button 
              className={`type-btn ${locationDetails.addressType === 'Home' ? 'active' : ''}`}
              onClick={() => setLocationDetails(prev => ({ ...prev, addressType: 'Home' }))}
            >
              🏠 Home
            </button>
            <button 
              className={`type-btn ${locationDetails.addressType === 'Work' ? 'active' : ''}`}
              onClick={() => setLocationDetails(prev => ({ ...prev, addressType: 'Work' }))}
            >
              🏢 Work
            </button>
            <button 
              className={`type-btn ${locationDetails.addressType === 'Hotel' ? 'active' : ''}`}
              onClick={() => setLocationDetails(prev => ({ ...prev, addressType: 'Hotel' }))}
            >
              🏨 Hotel
            </button>
            <button 
              className={`type-btn ${locationDetails.addressType === 'Other' ? 'active' : ''}`}
              onClick={() => setLocationDetails(prev => ({ ...prev, addressType: 'Other' }))}
            >
              📍 Other
            </button>
          </div>
        </div>
      </div>

      <button 
        className="submit-btn" 
        onClick={handleSaveAddress}
        disabled={loading}
      >
        {loading ? <Loader2 className="spinner" /> : 'Save Address'}
      </button>

      {isEditMode && (
        <button 
          onClick={() => {
            navigate('/add-address?action=add&redirect=' + encodeURIComponent(redirectUrl));
            setViewMode('form');
            setLocationDetails({ flat: '', area: '', pinCode: '', city: '', state: '', addressType: '' });
          }}
          style={{ width: '100%', padding: '16px', background: 'transparent', color: '#e50942', border: '2px dashed #cbd5e1', borderRadius: '16px', fontWeight: 700, marginTop: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={20} /> Add New Address Instead
        </button>
      )}
    </div>
  );

  const renderListView = () => {
    if (loadingList) {
      return (
        <div className="loading-state">
          <Loader2 className="spinner big" color="#e50942" />
          <p>Loading your addresses...</p>
        </div>
      );
    }

    return (
      <div className="address-list-container">
        <button className="add-new-address-btn" onClick={() => {
          navigate('/add-address?action=add&redirect=' + encodeURIComponent(redirectUrl));
          setViewMode('form');
          setLocationDetails({ flat: '', area: '', pinCode: '', city: '', state: '', addressType: '' });
        }}>
          <Plus size={20} /> Add New Address
        </button>

        <div className="saved-addresses-header">
          <h3>Saved Addresses</h3>
          <span className="address-count">{savedAddresses.length} saved</span>
        </div>

        <div className="address-cards-wrapper">
          {savedAddresses.map(addr => {
            const isSelected = addr.is_default == '1';
            return (
              <div 
                key={addr.id} 
                className={`address-card-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectAddressCard(addr.id)}
              >
                <div className="address-card-icon">
                  <MapPin size={22} color={isSelected ? "#e50942" : "#64748b"} />
                </div>
                
                <div className="address-card-details">
                  <div className="address-card-title-row">
                    <h4>{addr.save_as}</h4>
                    {isSelected && <div className="selected-badge"><CheckCircle2 size={12}/> Selected</div>}
                  </div>
                  <p>{
                    (() => {
                      const rawParts = [
                        addr.flat, 
                        addr.area_locality || addr.area, 
                        addr.city, 
                        addr.state, 
                        addr.pin || addr.pincode
                      ].filter(Boolean).map(s => String(s).trim());
                      
                      let parts = [...new Set(rawParts)];
                      
                      const longestPart = parts.reduce((a, b) => a.length > b.length ? a : b, '');
                      
                      if (longestPart.length > 20) {
                        parts = parts.filter(part => {
                          if (part === longestPart) return true;
                          if (longestPart.toLowerCase().includes(part.toLowerCase())) return false;
                          return true;
                        });
                      }
                      
                      return parts.join(', ');
                    })()
                  }</p>
                </div>

                <div className="address-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="action-icon-btn edit" onClick={() => {
                    setViewMode('form');
                    navigate(`/add-address?edit=true&id=${addr.id}&redirect=${encodeURIComponent(redirectUrl)}`);
                  }}>
                    <Edit2 size={16} />
                  </button>
                  <button className="action-icon-btn delete" onClick={() => setAddressToDelete(addr)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="add-address-page">
      <TopBar />

      <div className="add-address-page-header">
        <PageHeader
          title={viewMode === 'list' ? 'Manage Addresses' : (isEditMode ? 'Edit Address' : 'Add New Address')}
          onBack={() => {
            if (viewMode === 'form' && savedAddresses.length > 0) {
              if (isEditMode) {
                navigate(redirectUrl);
              } else {
                setViewMode('list');
              }
            } else {
              navigate(redirectUrl);
            }
          }}
          badge={viewMode === 'form' && savedAddresses.length > 0 ? `${savedAddresses.length} Addresses` : null}
          onBadgeClick={() => setViewMode('list')}
        />
      </div>

      {viewMode === 'list' ? renderListView() : renderFormView()}

      {addressToDelete && (
        <div className="custom-confirm-overlay" onClick={() => setAddressToDelete(null)}>
          <div className="custom-confirm-box" onClick={e => e.stopPropagation()}>
            <h3>Delete Address</h3>
            <p>Are you sure you want to delete this address? This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setAddressToDelete(null)}>Cancel</button>
              <button className="delete-btn" onClick={handleDeleteAddress}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default AddAddress;
