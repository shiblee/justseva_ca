import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import { getPrepareOrderData, placeOrder, LEGACY_ASSETS_BASE_URL } from '../services/api';
import { Search, ChevronRight, CheckCircle2, MapPin, MessageSquare, Shield, Clock, Star, Edit2, Plus, Check, Trash2 } from 'lucide-react';
import './BookService.css';

const BookService = () => {
  const { subcategoryId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [data, setData] = useState({ serviceInfo: null, addresses: [] });
  const [error, setError] = useState('');
  
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  useEffect(() => {
    const fetchPrepareData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const responseData = await getPrepareOrderData(subcategoryId, token);
        setData(responseData);
        
        // Auto-select first address if available
        if (responseData.addresses && responseData.addresses.length > 0) {
          setSelectedAddressId(responseData.addresses[0].id);
        }
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

    fetchPrepareData();
  }, [subcategoryId, navigate]);

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert('Please select or add a service address.');
      return;
    }
    
    setPlacingOrder(true);
    try {
      const token = localStorage.getItem('token');
      const res = await placeOrder({
        subcategoryId,
        addressId: selectedAddressId,
        additionalDetails
      }, token);
      
      // Successfully placed order
      const encodedId = btoa(res.data.orderId.toString());
      navigate(`/order-details/${encodedId}`, { state: { isNewOrder: true } });
      // alert('Order placed successfully!');
    } catch (err) {
      alert('Failed to place order: ' + err.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="book-service-page loading">
        <TopBar />
        <div className="loading-spinner">Preparing your order...</div>
      </div>
    );
  }

  const { serviceInfo, addresses } = data;

  return (
    <div className="book-service-page">
      <TopBar />
      
      <div className="book-service-content">
        {error && <div className="error-banner">{error}</div>}

        <div className="search-bar" style={{ marginBottom: '24px' }}>
          <Search size={18} color="#94a3b8" />
          <input type="text" placeholder="Search services, categories..." />
        </div>

        <div className="breadcrumbs">
          <span onClick={() => navigate('/dashboard')}>Home</span>
          <ChevronRight size={14} color="#94a3b8" />
          <span onClick={() => navigate(`/category/${serviceInfo?.category_id}`)}>{serviceInfo?.category_name}</span>
          <ChevronRight size={14} color="#94a3b8" />
          <span className="current">{serviceInfo?.name}</span>
        </div>

        <PageHeader title="Book Service" showBack={false} />

        <div className="order-summary-card">
          <div className="order-summary-header">
            <h3>Order Summary</h3>
            <p>Review before confirming</p>
          </div>
          <div className="order-summary-body">
            <div className="service-banner">
              <img src={`${LEGACY_ASSETS_BASE_URL}/uploads/sub-category/${serviceInfo?.image}`} alt={serviceInfo?.name} />
              <div className="service-banner-text">
                <span className="category-text">{serviceInfo?.category_name}</span>
                <span className="separator">/</span>
                <span className="subcategory-text">{serviceInfo?.name}</span>
              </div>
            </div>

            <div className="benefits-list">
              <div className="benefit-item">
                <div className="benefit-icon blue">
                  <Shield size={18} />
                </div>
                <div className="benefit-text">
                  <h4>Verified Pros</h4>
                  <p>Background checked & trained</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon green">
                  <Clock size={18} />
                </div>
                <div className="benefit-text">
                  <h4>On-Time Service</h4>
                  <p>Punctual professionals</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon red">
                  <Star size={18} />
                </div>
                <div className="benefit-text">
                  <h4>Top Rated</h4>
                  <p>Highly rated by customers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="section-title">
            <div className="section-icon pink"><MapPin size={18} /></div>
            <h2>Service Address</h2>
          </div>
          {addresses.length > 1 && (
            <div 
              className="address-count-badge" 
              onClick={() => setShowAddressModal(true)}
              style={{ cursor: 'pointer', color: '#e50942', background: '#fff1f2', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', border: '1px solid #ffe4e6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: 0, transform: 'translateY(-1px)' }}
            >
              {addresses.length} Addresses
            </div>
          )}
        </div>

        <div className="addresses-list">
          {addresses.length > 0 && selectedAddressId ? (
            // Show only the selected address
            addresses.filter(addr => addr.id === selectedAddressId).map((addr) => (
              <div 
                key={addr.id} 
                className="address-card selected"
              >
                <div className="address-type-row">
                  <div className="address-type">
                    <MapPin size={16} /> {addr.save_as || addr.address_type} 
                    {addr.is_default === '1' && <span className="default-badge">Default</span>}
                  </div>
                  <div className="check-icon">
                    <Check size={14} color="white" />
                  </div>
                </div>
                <p className="address-details">
                  {(() => {
                    const rawParts = [
                      addr.flat, 
                      addr.address, 
                      addr.landmark, 
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
                  })()}
                </p>
                
                <button 
                  className="edit-address-btn" 
                  onClick={(e) => { e.stopPropagation(); setShowAddressModal(true); }}
                  style={{ background: 'none', border: 'none', color: '#e50942', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}
                >
                  Change
                </button>
              </div>
            ))
          ) : (
            <button 
              className="add-new-address-card"
              onClick={() => navigate(`/add-address?redirect=/book-service/${subcategoryId}`)}
            >
              <div className="add-icon-wrapper"><Plus size={18} color="#e50942" /></div>
              Add New Address
            </button>
          )}
        </div>

        <div className="section-header">
          <div className="section-title">
            <div className="section-icon pink"><MessageSquare size={18} /></div>
            <h2>Additional Details <span className="optional">(optional)</span></h2>
          </div>
        </div>

        <div className="additional-details-wrapper">
          <textarea 
            placeholder="Example: Preferred time 4-6 PM, landmark near City Mall, brand/model of the item, any specific requirements..."
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            maxLength={500}
          />
          <div className="textarea-footer">
            <span className="help-text">Clear details help the professional serve you better</span>
            <span className="char-count">{additionalDetails.length}/500</span>
          </div>
        </div>

        <div className="bottom-checkout-bar">
          <button 
            className="confirm-order-btn" 
            onClick={handlePlaceOrder}
            disabled={placingOrder}
          >
            {placingOrder ? 'Processing...' : (
              <>
                <CheckCircle2 size={20} /> Confirm & Place Order
              </>
            )}
          </button>
          <p className="secure-text">
             Your order is secured. A professional will be assigned shortly.
          </p>
        </div>

      </div>

      {showAddressModal && (
        <div className="address-modal-overlay" onClick={() => setShowAddressModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="address-modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '24px 24px 0 0', padding: '24px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="address-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Select Address</h2>
              <button onClick={() => setShowAddressModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div className="address-modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {addresses.map(addr => (
                <div 
                  key={addr.id} 
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', border: selectedAddressId === addr.id ? '2px solid #e50942' : '1px solid #e2e8f0', borderRadius: '12px', background: selectedAddressId === addr.id ? '#fff1f2' : '#f8fafc', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', gap: '16px' }} onClick={() => { setSelectedAddressId(addr.id); setShowAddressModal(false); }}>
                    <div style={{ background: 'white', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={18} color="#e50942" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600 }}>{addr.save_as || addr.address_type}</h4>
                        {selectedAddressId === addr.id && <CheckCircle2 size={18} color="#e50942" />}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                        {(() => {
                          const rawParts = [
                            addr.flat, 
                            addr.address, 
                            addr.landmark, 
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
                        })()}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '4px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/add-address?edit=true&id=${addr.id}&redirect=/book-service/${subcategoryId}`); }}
                      style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setAddressToDelete(addr);
                      }}
                      style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => navigate(`/add-address?redirect=/book-service/${subcategoryId}`)}
                style={{ marginTop: '8px', padding: '16px', border: '1px dashed #cbd5e1', borderRadius: '12px', background: 'transparent', color: '#e50942', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Plus size={18} /> Add New Address
              </button>
            </div>
          </div>
        </div>
      )}
      
      {addressToDelete && (
        <div className="custom-confirm-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="custom-confirm-box" style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '340px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', color: '#0f172a' }}>Delete Address</h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b' }}>Are you sure you want to delete this address? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setAddressToDelete(null)} style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                try {
                  const { deleteAddress } = await import('../services/api');
                  await deleteAddress(addressToDelete.id, localStorage.getItem('token'));
                  const newAddresses = addresses.filter(a => a.id !== addressToDelete.id);
                  setData(prev => ({ ...prev, addresses: newAddresses }));
                  if (selectedAddressId === addressToDelete.id) {
                    setSelectedAddressId(newAddresses.length > 0 ? newAddresses[0].id : null);
                  }
                  setAddressToDelete(null);
                } catch (err) {
                  alert('Failed to delete address: ' + err.message);
                }
              }} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#ef4444', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookService;
