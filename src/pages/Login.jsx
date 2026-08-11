import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, Clock, Star, User, Send, MessageCircle, KeyRound, ArrowRight, Pencil, ArrowLeft } from 'lucide-react';

import Input from '../components/Input';
import Button from '../components/Button';
import { loginWithMobile, verifyOtp, loginWithGoogle, getPage } from '../services/api';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCount, setResendCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '' });

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOpenPage = async (pageId) => {
    try {
      const response = await getPage(pageId);
      if (response.success) {
        setModalContent({
          title: response.data.title,
          description: response.data.description
        });
        setModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load page content.');
    }
  };

  const isFormValid = mobileNumber.length >= 10 && agreed;
  const isOtpValid = otp.length === 6;

  const handleSendOTP = async () => {
    if (isFormValid) {
      if (step === 2 && resendCount >= 2) return;

      setLoading(true);
      setError('');
      try {
        await loginWithMobile(mobileNumber, agreed);
        if (step === 2) {
          setResendCount(prev => prev + 1);
        }
        setStep(2);
        setTimer(30);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOTP = async () => {
    if (isOtpValid) {
      setLoading(true);
      setError('');
      try {
        const data = await verifyOtp(mobileNumber, otp);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.name && data.user.phone_verified) {
          navigate('/dashboard');
        } else {
          navigate('/profile-completion');
        }
      } catch (err) {
        setError('Invalid OTP. Please enter the correct 6-digit OTP.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true);
    setError('');
    try {
      const data = await loginWithGoogle(tokenResponse.access_token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.user.name && data.user.phone_verified) {
        navigate('/dashboard');
      } else {
        navigate('/profile-completion');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google login failed or was cancelled.')
  });

  return (
    <div className="login-page">

      <div className="hero-banner">
        <h1 className="hero-title">Your home services, on demand.</h1>
        <div className="badges-container">
          <div className="badge">
            <ShieldCheck size={16} /> Verified Pros
          </div>
          <div className="badge">
            <Clock size={16} /> Quick Booking
          </div>
          <div className="badge">
            <Star size={16} /> Rated Service
          </div>
        </div>
      </div>

      <div className="login-card-wrapper">
        <div className="login-card">
          <h2 className="welcome-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative' }}>
            {step === 2 && (
              <ArrowLeft size={20} style={{ cursor: 'pointer', position: 'absolute', left: '0' }} onClick={() => setStep(1)} title="Go Back" />
            )}
            {step === 1 ? 'Welcome back' : 'OTP Verification'}
          </h2>
          <p className="subtitle-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {step === 1 ? 'Enter your mobile number to continue' : (
              <>
                Enter the 6-digit OTP sent to {mobileNumber}
                <Pencil size={14} style={{ cursor: 'pointer', color: '#007bff' }} onClick={() => setStep(1)} title="Edit Mobile Number" />
              </>
            )}
          </p>
          
          {error && <div style={{color: 'red', fontSize: '14px', marginBottom: '16px', textAlign: 'center'}}>{error}</div>}

          {step === 1 ? (
            <>
              <Input 
                icon={<User size={20} />} 
                placeholder="10-digit mobile number" 
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                maxLength={10}
              />
              
              <div className="terms-checkbox-wrapper" style={{ display: 'flex', alignItems: 'flex-start', marginTop: '16px', marginBottom: '20px', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#E50942', flexShrink: 0 }}
                />
                <span className="terms-text" style={{ fontSize: '13px', color: '#6B7280', lineHeight: '20px' }}>
                  By continuing, you agree to our <span className="link-text" style={{cursor: 'pointer'}} onClick={() => handleOpenPage(1)}>Terms & Conditions</span> and <span className="link-text" style={{cursor: 'pointer'}} onClick={() => handleOpenPage(2)}>Privacy Policy</span>.
                </span>
              </div>
              
              <Button 
                variant="primary" 
                disabled={!isFormValid || loading}
                onClick={handleSendOTP}
              >
                {loading ? 'Sending...' : <><Send size={18} /> Send OTP</>}
              </Button>
              
              <div className="divider">
                <span>or continue with</span>
              </div>
              
              <Button variant="google" onClick={() => loginGoogle()}>
                <div className="google-icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <span style={{ marginLeft: '8px' }}>Continue with Google</span>
              </Button>
            </>
          ) : (
            <>
              <Input 
                icon={<KeyRound size={20} />} 
                placeholder="6-digit OTP" 
                type="tel"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ''))}
                maxLength={6}
              />
              
              <div style={{ marginTop: '24px' }}>
                <Button 
                  variant="primary" 
                  disabled={!isOtpValid || loading}
                  onClick={handleVerifyOTP}
                >
                  {loading ? 'Verifying...' : <><ArrowRight size={18} /> Verify & Login</>}
                </Button>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
                {resendCount >= 2 ? (
                  <span style={{ color: 'red' }}>Maximum resend attempts reached.</span>
                ) : timer > 0 ? (
                  <span>Resend OTP in <span style={{ fontWeight: 'bold' }}>{timer}s</span></span>
                ) : (
                  <span>Didn't receive code? <span className="link-text" onClick={handleSendOTP} style={{cursor: 'pointer'}}>Resend</span></span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)} style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white', padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 className="modal-title" style={{ margin: 0 }}>{modalContent.title}</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6B7280', lineHeight: 1 }}>&times;</button>
            </div>
            <div className="modal-text" style={{ overflowY: 'auto', flex: 1, paddingRight: '8px', textAlign: 'left', fontSize: '14px', lineHeight: '1.6', color: '#374151' }} dangerouslySetInnerHTML={{ __html: modalContent.description }}></div>
            <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
              <button className="modal-btn confirm" onClick={() => setModalOpen(false)} style={{ padding: '8px 16px', background: '#E50942', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="whatsapp-fab">
        <MessageCircle size={24} />
        Chat with us
      </div>
    </div>
  );
};

export default Login;
