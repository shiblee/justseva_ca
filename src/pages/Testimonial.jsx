import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import Button from '../components/Button';
import Input from '../components/Input';
import { getTestimonials, storeTestimonial, deleteTestimonial } from '../services/api';
import { MessageSquare, MapPin, Trash2, Camera, Upload, X, Check, Star, ChevronDown, ChevronUp, Clock, AlertCircle } from 'lucide-react';
import './EditProfile.css';
import './Testimonial.css';

const Testimonial = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  
  const [myTestimonial, setMyTestimonial] = useState(null);
  const [rejectedTestimonial, setRejectedTestimonial] = useState(null);
  const [deletedTestimonials, setDeletedTestimonials] = useState([]);
  const [showPastSubmissions, setShowPastSubmissions] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Form State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState('');
  const [profileSource, setProfileSource] = useState('upload'); // 'existing' or 'upload'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  const [userProfileUrl, setUserProfileUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.profile_url) {
        setUserProfileUrl(user.profile_url);
        setProfileSource('existing');
      }

      const res = await getTestimonials(token);
      if (res.data.myTestimonial) {
        setMyTestimonial(res.data.myTestimonial);
      } else {
        setMyTestimonial(null);
      }
      setRejectedTestimonial(res.data.rejectedTestimonial || null);
      setDeletedTestimonials(res.data.deletedTestimonials || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        setApiError('Unsupported image format. Use JPG, PNG or WEBP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setApiError('Image is too large. Max size is 5MB.');
        return;
      }
      setApiError('');
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setProfileSource('upload');
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (rating === 0) {
      setApiError('Please select a star rating.');
      return;
    }
    if (comment.trim().length < 10) {
      setApiError('Review must be at least 10 characters long.');
      return;
    }
    if (!location.trim()) {
      setApiError('Please enter your location.');
      return;
    }
    if (profileSource === 'upload' && !selectedFile) {
      setApiError('Please upload a profile image.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('comment', comment);
      formData.append('location', location);
      formData.append('profile_source', profileSource);
      if (profileSource === 'upload' && selectedFile) {
        formData.append('photo', selectedFile);
      }

      await storeTestimonial(formData, token);
      await fetchData(); // Refresh data to show submitted view
    } catch (err) {
      setApiError(err.message || 'Failed to submit testimonial.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await deleteTestimonial(myTestimonial.id, token);
      setMyTestimonial(null);
      
      // Reset form
      setRating(0);
      setComment('');
      setLocation('');
      removeSelectedFile();
      setShowConfirmModal(false);
    } catch (err) {
      alert(err.message || 'Failed to delete testimonial.');
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-page">
        <TopBar />
        <div className="loading-spinner-container">
          <div className="spinner"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="edit-profile-page">
      <TopBar />
      
      <div className="edit-profile-container">
        <PageHeader title="Testimonial" />

        <div className="edit-profile-card">

          {rejectedTestimonial && !myTestimonial && (
            <div className="rejected-testimonial-section">
              <h5 className="section-pre-title">PREVIOUSLY REJECTED</h5>
              <div className="rejected-header-banner">
                <div className="rejected-dot"></div>
                <span className="rejected-text">Your testimonial has been submitted.</span>
                <span className="rejected-badge">REJECTED</span>
              </div>
              <div className="rejected-card-body">
                <div className="submitted-view" style={{ padding: '0', background: 'transparent' }}>
                  <div className="submitted-header-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <img src={rejectedTestimonial.profile_url} alt="Profile" className="submitted-avatar" style={{ width: '70px', height: '70px' }} />
                    <div className="submitted-header-info" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div className="submitted-rating" style={{ marginBottom: '0' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={18} fill={star <= rejectedTestimonial.rating ? '#f7b500' : 'none'} color={star <= rejectedTestimonial.rating ? '#f7b500' : '#cbd5e1'} />
                        ))}
                      </div>
                      <div className="submitted-location" style={{ marginBottom: '0' }}>
                        <MapPin size={14} color="#e50942" /> {rejectedTestimonial.location}
                      </div>
                    </div>
                  </div>
                  <div className="submitted-content-full" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p className="submitted-comment" style={{ margin: '0' }}>{rejectedTestimonial.comment}</p>
                    <div className="submitted-date" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> Submitted on {new Date(rejectedTestimonial.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(rejectedTestimonial.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}
                    </div>
                    <div className="rejection-reason-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={16} color="#dc2626" />
                        <span style={{ fontWeight: 'bold', color: '#dc2626' }}>Rejection reason:</span>
                        <span style={{ color: '#991b1b' }}>{rejectedTestimonial.reject_remark || 'Not specified'}</span>
                      </div>
                      {rejectedTestimonial.updated_at && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', paddingLeft: '22px' }}>
                          <Clock size={10} style={{ display: 'inline', marginRight: '4px' }} />
                          Rejected on {new Date(rejectedTestimonial.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(rejectedTestimonial.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!myTestimonial ? (
            <>
              {apiError && <div className="error-banner">{apiError}</div>}
              
              <div className="testimonial-photo-card">
                <div className="photo-avatar-wrapper shadow-lg">
                  <img 
                    src={previewImage || userProfileUrl || `https://ui-avatars.com/api/?name=User&background=random`} 
                    alt="Profile" 
                    className="photo-avatar"
                  />
                </div>
                <div className="photo-details">
                  <h3 className="photo-title">Profile Photo</h3>
                  <p className="photo-subtitle">This photo will appear next to your testimonial.</p>
                  
                  <div className="segmented-control">
                    {userProfileUrl && (
                      <div className={`segment-btn ${profileSource === 'existing' ? 'active' : ''}`} onClick={() => setProfileSource('existing')}>
                        {profileSource === 'existing' && <Check size={14} className="segment-check" />}
                        Use Current
                      </div>
                    )}
                    <div className={`segment-btn ${profileSource === 'upload' ? 'active' : ''}`} onClick={() => setProfileSource('upload')}>
                      {profileSource === 'upload' && <Check size={14} className="segment-check" />}
                      Upload New
                    </div>
                  </div>

                  {profileSource === 'upload' && (
                    <div className="upload-action-area">
                      <button className="modern-upload-btn" onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}>
                        <Camera size={18} /> Choose Photo
                      </button>
                      {selectedFile && <span className="file-name-hint">{selectedFile.name}</span>}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        accept="image/jpeg,image/png,image/webp,image/gif" 
                        onChange={handleFileChange} 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <div className="form-group">
                  <label className="ep-label">How was your experience? <span className="required">*</span></label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={40}
                        fill={star <= rating ? '#f7b500' : 'none'}
                        color={star <= rating ? '#f7b500' : '#cbd5e1'}
                        className={`star-icon ${star <= rating ? 'active' : ''}`}
                        onClick={() => setRating(star)}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <Input 
                    icon={<MessageSquare size={18} />}
                    label="Your Review *"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    multiline={true}
                    rows={4}
                    maxLength={500}
                  />
                  <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'right', marginTop: '4px', paddingRight: '4px' }}>
                    {comment.length}/500 characters
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <Input 
                    icon={<MapPin size={18} />}
                    label="Location *"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="save-btn-wrapper">
                  <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Testimonial'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="submitted-testimonial-wrapper" style={{ padding: '0' }}>
              <div className="submitted-view" style={{ padding: '0', background: 'transparent' }}>
                <div className="submitted-header-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                  <img src={myTestimonial.profile_url} alt="Profile" className="submitted-avatar" style={{ width: '70px', height: '70px' }} />
                  <div className="submitted-header-info" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className={`status-badge status-${myTestimonial.status}`} style={{ marginBottom: '0' }}>
                      {myTestimonial.status === 'pending' ? 'Pending Approval' : 
                       myTestimonial.status === 'approved' ? 'Approved' : 'Rejected'}
                    </div>
                    <div className="submitted-rating" style={{ marginBottom: '0' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          fill={star <= myTestimonial.rating ? '#f7b500' : 'none'}
                          color={star <= myTestimonial.rating ? '#f7b500' : '#cbd5e1'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="submitted-content-full" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="submitted-location" style={{ marginBottom: '0' }}>
                    <MapPin size={14} /> {myTestimonial.location}
                  </div>
                  
                  <p className="submitted-comment" style={{ margin: '0' }}>"{myTestimonial.comment}"</p>
                  
                  <div className="submitted-date">
                    Submitted: {new Date(myTestimonial.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <Button variant="outline" onClick={handleDeleteClick} style={{ marginTop: '20px', color: '#dc2626', borderColor: '#fca5a5' }}>
                <Trash2 size={18} /> Delete & Write a New One
              </Button>
            </div>
          )}

          {deletedTestimonials.length > 0 && (
            <div className="past-submissions-section">
              <div 
                className="past-submissions-header" 
                onClick={() => setShowPastSubmissions(!showPastSubmissions)}
              >
                <div className="past-submissions-title">
                  <Clock size={16} /> PAST SUBMISSIONS ({deletedTestimonials.length})
                </div>
                {showPastSubmissions ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
              </div>
              
              {showPastSubmissions && (
                <div className="past-submissions-list">
                  {deletedTestimonials.map((testimonial) => (
                    <div key={testimonial.id} className="past-submission-card">
                      <div className="submitted-view" style={{ padding: '0', background: 'transparent' }}>
                        <div className="submitted-header-row" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                          <img src={testimonial.profile_url} alt="Profile" className="submitted-avatar" style={{ width: '70px', height: '70px' }} />
                          <div className="submitted-header-info" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div className="submitted-rating" style={{ marginBottom: '0' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={18} fill={star <= testimonial.rating ? '#f7b500' : 'none'} color={star <= testimonial.rating ? '#f7b500' : '#cbd5e1'} />
                              ))}
                            </div>
                            <div className="submitted-location" style={{ marginBottom: '0' }}>
                              <MapPin size={14} color="#e50942" /> {testimonial.location}
                            </div>
                          </div>
                        </div>
                        <div className="submitted-content-full" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <p className="submitted-comment" style={{ margin: '0' }}>{testimonial.comment}</p>
                          <div className="submitted-date" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Submitted on {new Date(testimonial.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(testimonial.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showConfirmModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <div className="custom-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Trash2 size={24} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Delete Testimonial?</h3>
              </div>
              <div className="close-btn" onClick={() => setShowConfirmModal(false)} style={{ cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </div>
            </div>
            <div className="custom-modal-body">
              <p style={{ margin: 0, color: '#475569', lineHeight: '1.5' }}>
                Are you sure you want to delete your testimonial? This action cannot be undone and you will need to write a new one.
              </p>
            </div>
            <div className="custom-modal-footer">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={confirmDelete} style={{ background: '#dc2626', borderColor: '#dc2626' }}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Testimonial;
