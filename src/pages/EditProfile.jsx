import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import Input from '../components/Input';
import Button from '../components/Button';
import CustomSelect from '../components/CustomSelect';
import { User, CheckCircle2, Upload, MessageCircle, Mail, Phone, Hash, Check, Camera } from 'lucide-react';
import { sendProfileOtp, verifyProfileOtp, updateProfile } from '../services/api';
import './EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', email: '', username: '', profile_pic: '' });
  
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  
  // Mobile Change State
  const [isEditingMobile, setIsEditingMobile] = useState(false);
  const [newMobile, setNewMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiError, setApiError] = useState('');
  const [resendCount, setResendCount] = useState(0);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);
  
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [ageHint, setAgeHint] = useState('');
  const [gender, setGender] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setFullName(parsed.name || '');
      
      if (parsed.username && !parsed.username.includes('@')) {
        setMobileNumber(parsed.username);
      }
      if (parsed.email) {
        setEmail(parsed.email);
      } else if (parsed.username && parsed.username.includes('@')) {
        setEmail(parsed.username);
      }
      
      if (parsed.dob) {
        const parts = parsed.dob.split('/');
        if (parts.length === 3) {
          setDay(parts[0]);
          setMonth(parts[1]);
          setYear(parts[2]);
        }
      }
      if (parsed.gender) {
        setGender(parsed.gender);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (day && month && year) {
      const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age >= 0) {
        setAgeHint(`Age: ${age} ${age === 1 ? 'year' : 'years'} old`);
      } else {
        setAgeHint('');
      }
    } else {
      setAgeHint('');
    }
  }, [day, month, year]);

  const handleSave = async () => {
    setLoading(true);
    setApiError('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', fullName);
      formData.append('gender', gender);
      if (day && month && year) {
        formData.append('dob', `${day}/${month}/${year}`);
      } else {
        formData.append('dob', '');
      }
      
      if (selectedFile) {
        formData.append('profile_pic', selectedFile);
      }
      
      const response = await updateProfile(formData, token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setSaveSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      setApiError(err.message || 'Failed to save profile changes.');
      setLoading(false);
    }
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser(prev => ({ ...prev, profile_pic: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendOtp = async () => {
    if (!newMobile || newMobile.length !== 10) {
      setApiError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (otpSent && resendCount >= 2) return;
    
    setLoading(true);
    setApiError('');
    try {
      const token = localStorage.getItem('token');
      await sendProfileOtp(newMobile, token);
      if (otpSent) setResendCount(prev => prev + 1);
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
      setApiError('Please enter a valid 6-digit OTP.');
      return;
    }
    setVerifying(true);
    setApiError('');
    try {
      const token = localStorage.getItem('token');
      await verifyProfileOtp(newMobile, otp, token);
      setMobileNumber(newMobile);
      setIsEditingMobile(false);
      setOtpSent(false);
      setOtp('');
      
      // Update local storage
      const updatedUser = { ...user, username: newMobile };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      setApiError(err.message || 'Failed to verify OTP.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="edit-profile-page">
      <TopBar />
      
      <div className="edit-profile-container">
        
        <PageHeader title="Edit Profile" />

        <div className="edit-profile-card">
          
          <div className="photo-section" style={{ justifyContent: 'center' }}>
            <div className="photo-avatar-wrapper" onClick={handlePhotoUpload} style={{ position: 'relative', cursor: 'pointer' }}>
              <img 
                src={user.profile_pic || user.profile_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`} 
                alt="Profile" 
                className="photo-avatar"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`; }}
              />
              <div className="photo-edit-badge">
                <Camera size={16} color="#fff" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="form-section">
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <Input 
                icon={<User size={18} />}
                label="Full Name *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {apiError && <div className="error-banner" style={{ color: '#e50942', fontSize: '0.9rem', marginBottom: '16px' }}>{apiError}</div>}
            
            <div className="form-group" style={{ marginBottom: '12px' }}>
              {!isEditingMobile ? (
                <>
                  <Input 
                    icon={<Phone size={18} />}
                    label="10-digit mobile number"
                    value={mobileNumber}
                    disabled={true}
                  />
                  <div className="verification-status">
                    {mobileNumber ? (
                      <span className="verified-text"><CheckCircle2 size={14} /> Verified</span>
                    ) : (
                      <span></span>
                    )}
                    <span className="change-link" onClick={() => {
                      setIsEditingMobile(true);
                      setNewMobile('');
                      setApiError('');
                    }}>{mobileNumber ? 'Change' : 'Add Number'}</span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <Input 
                        icon={<Phone size={18} />}
                        label="Enter new mobile number"
                        value={newMobile}
                        onChange={(e) => {
                          setNewMobile(e.target.value.replace(/\D/g, ''));
                          setApiError('');
                        }}
                        maxLength={10}
                        disabled={otpSent}
                      />
                    </div>
                    {!otpSent && (
                      <Button variant="outline" onClick={handleSendOtp} disabled={loading} style={{ height: '52px', padding: '0 24px', flexShrink: 0, width: 'auto' }}>
                        {loading ? 'Sending...' : 'Verify'}
                      </Button>
                    )}
                  </div>
                  
                  {otpSent && (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <Input 
                          icon={<Hash size={18} />} 
                          label="Enter OTP *" 
                          value={otp} 
                          onChange={(e) => {
                            setOtp(e.target.value.replace(/\D/g, ''));
                            setApiError('');
                          }}
                          maxLength={6} 
                        />
                      </div>
                      <Button variant="primary" onClick={handleVerifyOtp} disabled={verifying} style={{ height: '52px', padding: '0 24px', flexShrink: 0, width: 'auto' }}>
                        Confirm
                      </Button>
                    </div>
                  )}
                  {otpSent && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
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
                  <span className="change-link" onClick={() => {
                    setIsEditingMobile(false);
                    setOtpSent(false);
                    setApiError('');
                  }} style={{ fontSize: '0.85rem', color: '#64748b' }}>Cancel</span>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <Input 
                icon={<Mail size={18} />}
                label="Email Address"
                value={email}
                type="email"
                disabled={true}
              />
              <div className="verification-status">
                {email && (
                  <span className="verified-text"><CheckCircle2 size={14} /> Verified • your registered login email</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="ep-label">Date of Birth</label>
              <div className="dob-dropdowns" style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <CustomSelect 
                    value={day} 
                    onChange={setDay} 
                    placeholder="Day"
                    options={[...Array(31)].map((_, i) => ({ value: String(i+1), label: String(i+1) }))} 
                  />
                </div>
                <div style={{ flex: 1.2 }}>
                  <CustomSelect 
                    value={month} 
                    onChange={setMonth} 
                    placeholder="Month"
                    options={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => ({ value: String(i+1), label: m }))} 
                  />
                </div>
                <div style={{ flex: 1.4 }}>
                  <CustomSelect 
                    value={year} 
                    onChange={setYear} 
                    placeholder="Year"
                    options={[...Array(100)].map((_, i) => {
                      const y = String(new Date().getFullYear() - i);
                      return { value: y, label: y };
                    })} 
                  />
                </div>
              </div>
              {ageHint && (
                <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> {ageHint}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="ep-label">Gender <span className="required">*</span></label>
              <div className="gender-options">
                <button 
                  className={`gender-btn ${gender === 'Male' ? 'active' : ''}`}
                  onClick={() => setGender('Male')}
                >
                  <User size={18} /> Male
                </button>
                <button 
                  className={`gender-btn ${gender === 'Female' ? 'active' : ''}`}
                  onClick={() => setGender('Female')}
                >
                  <User size={18} /> Female
                </button>
                <button 
                  className={`gender-btn ${gender === 'Other' ? 'active' : ''}`}
                  onClick={() => setGender('Other')}
                >
                  <User size={18} /> Other
                </button>
              </div>
            </div>
            
          </div>
          
          <div className="save-btn-wrapper">
            <Button 
              variant="primary" 
              onClick={handleSave} 
              disabled={loading || saveSuccess}
              style={saveSuccess ? { background: '#10B981', borderColor: '#10B981', color: '#ffffff', transition: 'all 0.3s ease' } : { transition: 'all 0.3s ease' }}
            >
              {loading && !saveSuccess ? 'Saving...' : saveSuccess ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Check size={20} /> Profile Saved
                </div>
              ) : 'Save Changes'}
            </Button>
          </div>
          
        </div>

      </div>
      
      <div className="whatsapp-fab">
        <MessageCircle size={24} />
        Chat with us
      </div>

      <BottomNav />
    </div>
  );
};

export default EditProfile;
