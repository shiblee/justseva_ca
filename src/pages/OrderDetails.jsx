import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Map,
  Layers,
  XCircle,
  AlertCircle,
  Check,
  CheckCircle2,
  Wrench,
  Star,
  Phone,
  UserCheck
} from 'lucide-react';
import Confetti from 'react-confetti';
import { getOrderDetails, cancelOrder, submitRating, LEGACY_ASSETS_BASE_URL } from '../services/api';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import './OrderDetails.css';

const StarPicker = ({ value, onChange, size = 26 }) => (
  <div className="star-picker">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        type="button"
        key={n}
        className="star-picker-btn"
        onClick={() => onChange(n)}
        aria-label={`${n} star${n > 1 ? 's' : ''}`}
      >
        <Star size={size} fill={n <= value ? '#facc15' : 'none'} color={n <= value ? '#facc15' : '#cbd5e1'} strokeWidth={1.5} />
      </button>
    ))}
  </div>
);

const StaticStars = ({ value, size = 14 }) => (
  <>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={size} fill={n <= Math.round(value) ? '#facc15' : 'none'} color="#facc15" strokeWidth={1.5} />
    ))}
  </>
);

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [order, setOrder] = useState(null);
  const [statusLog, setStatusLog] = useState([]);
  const [cancellation, setCancellation] = useState(null);
  const [partner, setPartner] = useState(null);
  const [rating, setRating] = useState(null);
  const [canRate, setCanRate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showConfetti, setShowConfetti] = useState(false);

  // Cancellation Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Rating prompts
  const [showRatingTeaser, setShowRatingTeaser] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingForm, setRatingForm] = useState({ quality: 0, behaviour: 0, onTime: 0, comment: '' });
  const [ratingFormError, setRatingFormError] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const decodedId = atob(id);

  useEffect(() => {
    // Check if we just booked this order
    if (location.state?.isNewOrder) {
      setShowConfetti(true);
      // Stop confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000);
    }

    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const data = await getOrderDetails(decodedId, token);
        setOrder(data.order);
        setStatusLog(data.statusLog || []);
        setCancellation(data.cancellation || null);
        setPartner(data.partner || null);
        setRating(data.rating || null);
        setCanRate(!!data.canRate);

        // Auto-prompt for a rating once, right after the order is completed
        if (data.canRate && data.order) {
          const dismissedKey = `rating_prompt_dismissed_${data.order.order_id}`;
          if (!localStorage.getItem(dismissedKey)) {
            setShowRatingTeaser(true);
          }
        }
      } catch (err) {
        setError('Failed to load order details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [decodedId, location.state]);

  const dismissRatingTeaser = () => {
    setShowRatingTeaser(false);
    if (order) localStorage.setItem(`rating_prompt_dismissed_${order.order_id}`, '1');
  };

  const submitRatingForm = async () => {
    const { quality, behaviour, onTime, comment } = ratingForm;
    if (!quality || !behaviour || !onTime) {
      setRatingFormError('Please rate all three categories.');
      return;
    }

    setSubmittingRating(true);
    setRatingFormError('');
    try {
      const token = localStorage.getItem('token');
      const res = await submitRating(order.order_id, {
        qualityRating: quality,
        behaviourRating: behaviour,
        onTimeRating: onTime,
        comment
      }, token);
      setRating(res.data.rating);
      setCanRate(false);
      setShowRatingModal(false);
      localStorage.removeItem(`rating_prompt_dismissed_${order.order_id}`);
    } catch (err) {
      setRatingFormError(err.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const [selectedReason, setSelectedReason] = useState('');
  const cancelReasons = [
    "Found another service provider",
    "Change in plan / No longer need the service",
    "Service required urgently, vendor not available in time",
    "Incorrect service selected by mistake",
    "Vendor quoted higher than expected / not affordable"
  ];

  const confirmCancel = async () => {
    if (!order) return;
    if (!selectedReason) {
      alert('Please select a reason for cancelling.');
      return;
    }
    
    setIsCancelling(true);
    try {
      const token = localStorage.getItem('token');
      await cancelOrder(order.order_id, selectedReason, token);

      const cancelledAt = new Date().toISOString();
      setOrder({ ...order, status: 'Cancelled By Customer', cancelled_at: cancelledAt });
      setStatusLog(prev => [...prev, { order_status: 'Cancelled By Customer', created_at: cancelledAt }]);
      setCancellation({ reason: selectedReason, created_at: cancelledAt });
      setCancelModalOpen(false);
    } catch (err) {
      alert(`Failed to cancel order: ${err.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const renderCancelModal = () => {
    if (!cancelModalOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content advanced-cancel-modal">
          <button className="close-modal-btn" onClick={() => setCancelModalOpen(false)}>✕</button>
          
          <div className="modal-header-section">
            <div className="modal-icon-container cancel-icon-wrapper">
              <XCircle size={28} color="#dc2626" />
            </div>
            <h3 className="modal-title">Cancel Order</h3>
            <p className="modal-subtitle">Please tell us why you're cancelling</p>
          </div>

          <div className="reasons-list">
            {cancelReasons.map((reason, index) => (
              <label 
                key={index} 
                className={`reason-item ${selectedReason === reason ? 'selected' : ''}`}
                onClick={() => setSelectedReason(reason)}
              >
                <span className="reason-text">{reason}</span>
                <div className={`radio-circle ${selectedReason === reason ? 'active' : ''}`}>
                  {selectedReason === reason && <Check size={16} color="#ffffff" strokeWidth={3} />}
                </div>
              </label>
            ))}
          </div>

          <div className="modal-actions sticky-actions">
            <button 
              className="modal-btn outline-btn" 
              onClick={() => setCancelModalOpen(false)}
              disabled={isCancelling}
            >
              <ArrowLeft size={16} /> Go Back
            </button>
            <button 
              className="modal-btn danger-btn filled-red" 
              onClick={confirmCancel}
              disabled={isCancelling || !selectedReason}
            >
              <XCircle size={16} /> {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRatingTeaser = () => {
    if (!showRatingTeaser || !order) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content rating-teaser-modal">
          <button className="close-modal-btn" onClick={dismissRatingTeaser}>✕</button>

          <div className="teaser-header">
            <div className="teaser-stars">
              <StaticStars value={5} size={30} />
            </div>
            <h3>How was your service?</h3>
            <p>Your feedback helps {partner?.name || 'our partner'} and other customers.</p>
          </div>

          <div className="teaser-service-card">
            <div className="teaser-service-icon">
              <CheckCircle2 size={20} color="#e50942" />
            </div>
            <div>
              <h4>{order.subcategory_name}</h4>
              <p>#{order.order_no} · by {partner?.name || 'Partner'} · {formatDateOnly(order.completed_at || order.created_at)}</p>
            </div>
          </div>

          <div className="modal-actions">
            <button className="modal-btn outline-btn" onClick={dismissRatingTeaser}>
              Maybe Later
            </button>
            <button
              className="modal-btn primary-btn"
              onClick={() => { setShowRatingTeaser(false); setShowRatingModal(true); }}
            >
              <Star size={16} /> Rate Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRatingModal = () => {
    if (!showRatingModal || !order) return null;
    const { quality, behaviour, onTime, comment } = ratingForm;

    return (
      <div className="modal-overlay">
        <div className="modal-content rate-order-modal">
          <div className="rate-order-header">
            <h3><Star size={18} /> Rate Order <span>#{order.order_no}</span></h3>
            <button className="close-modal-btn" onClick={() => setShowRatingModal(false)} disabled={submittingRating}>✕</button>
          </div>

          <div className="rate-order-body">
            <div className="rate-field">
              <label>Service Quality</label>
              <StarPicker value={quality} onChange={(v) => setRatingForm(prev => ({ ...prev, quality: v }))} />
            </div>

            <div className="rate-field">
              <label>Partner Behaviour / Professionalism</label>
              <StarPicker value={behaviour} onChange={(v) => setRatingForm(prev => ({ ...prev, behaviour: v }))} />
            </div>

            <div className="rate-field">
              <label>Timeliness / Punctuality</label>
              <StarPicker value={onTime} onChange={(v) => setRatingForm(prev => ({ ...prev, onTime: v }))} />
            </div>

            <div className="rate-field">
              <div className="rate-field-header">
                <label>Comment (optional)</label>
                <span className="char-count">{comment.length}/500</span>
              </div>
              <textarea
                className="rate-comment-input"
                placeholder="Write your feedback..."
                value={comment}
                maxLength={500}
                onChange={(e) => setRatingForm(prev => ({ ...prev, comment: e.target.value }))}
              />
            </div>

            {ratingFormError && <div className="field-error">{ratingFormError}</div>}
          </div>

          <div className="modal-actions sticky-actions">
            <button
              className="modal-btn outline-btn"
              onClick={() => setShowRatingModal(false)}
              disabled={submittingRating}
            >
              Close
            </button>
            <button
              className="modal-btn primary-btn"
              onClick={submitRatingForm}
              disabled={submittingRating}
            >
              {submittingRating ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const formatFullDateTime = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleString('en-GB', options).replace(',', ',');
  };

  const getStatusMeta = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('cancel')) return { icon: XCircle, color: '#dc2626', className: 'cancelled' };
    if (s.includes('complete')) return { icon: CheckCircle2, color: '#16a34a', className: 'completed' };
    if (s.includes('accept')) return { icon: Wrench, color: '#0ea5e9', className: 'accepted' };
    return { icon: Clock, color: '#e50942', className: 'requested' };
  };

  // Fall back to the order's own timestamps if the status log has nothing (e.g. very old orders)
  const timeline = statusLog.length > 0
    ? statusLog
    : [
        { order_status: 'Service Requested', created_at: order?.created_at },
        ...(order?.status && order.status !== 'Service Requested' && order?.cancelled_at
          ? [{ order_status: order.status, created_at: order.cancelled_at }]
          : [])
      ];

  const formatDateOnly = (dateString) => {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleString('en-GB', options);
  };

  if (loading) {
    return (
      <div className="order-details-page loading">
        <div className="spinner"></div>
        <BottomNav />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-page error">
        <p>{error || 'Order not found'}</p>
        <button onClick={() => navigate('/my-orders')}>Go Back</button>
        <BottomNav />
      </div>
    );
  }

  // Construct full address string
  const getFullAddress = () => {
    const rawParts = [
      order.house_no,
      order.locality,
      order.city,
      order.state,
      order.pincode
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

    return parts.join(', ') || 'No address provided';
  };

  const isCancellable = order.status && 
    !order.status.toLowerCase().includes('cancel') && 
    !order.status.toLowerCase().includes('complete');

  return (
    <div className="order-details-page">
      <TopBar />
      
      {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}
      
      <div className="od-container">
        <PageHeader title="Order Details" onBack={() => navigate('/my-orders')} />

        {/* Pink Summary Card */}
        <div className="pink-card">
          <span className="od-label">ORDER ID</span>
          <h2 className="od-order-no">#{order.order_no}</h2>
          <div className="od-datetime-row">
            <Clock size={12} /> {formatFullDateTime(order.created_at)}
          </div>
          {(() => {
            const pillMeta = getStatusMeta(order.status);
            const PillIcon = pillMeta.icon;
            return (
              <div className={`od-status-pill ${pillMeta.className}`}>
                <PillIcon size={12} /> {order.status}
              </div>
            );
          })()}
        </div>

        {/* Order Progress */}
        <div className="od-section">
          <div className="od-card-header">
            <div className="od-card-icon-container">
              <Map size={18} color="#e50942" />
            </div>
            <h3 className="od-card-title">Order Progress</h3>
          </div>
          <div className="od-card-content">
            {timeline.map((step, idx) => {
              const meta = getStatusMeta(step.order_status);
              const StepIcon = meta.icon;
              const isCancelledStep = meta.className === 'cancelled';
              const isLast = idx === timeline.length - 1;
              const nextMeta = !isLast ? getStatusMeta(timeline[idx + 1].order_status) : null;
              return (
                <div className="progress-item" key={`${step.order_status}-${step.created_at}-${idx}`}>
                  <div className="progress-icon-col">
                    <div className={`progress-icon-circle ${meta.className}`}>
                      <StepIcon size={16} color={meta.color} />
                    </div>
                    {!isLast && (
                      <div className={`progress-connector ${nextMeta?.className === 'cancelled' ? 'cancelled' : ''}`} />
                    )}
                  </div>
                  <div className="progress-text">
                    <h4 className={isCancelledStep ? 'text-red' : ''}>{step.order_status}</h4>
                    {step.created_at && (
                      <p><Clock size={10} /> {formatFullDateTime(step.created_at)}</p>
                    )}
                    {isCancelledStep && cancellation?.reason && (
                      <p className="cancel-reason-text">Reason: {cancellation.reason}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Service Details */}
        <div className="od-section">
          <div className="od-card-header">
            <div className="od-card-icon-container blue">
              <Layers size={18} color="#3b82f6" />
            </div>
            <h3 className="od-card-title">Service Details</h3>
          </div>
          <div className="od-card-content p-0">
            <div className="service-detail-row">
              <img 
                src={order.subcategory_image ? `${LEGACY_ASSETS_BASE_URL}/uploads/sub-category/${order.subcategory_image}` : 'https://placehold.co/100x100?text=Service'}
                alt={order.subcategory_name} 
                className="detail-thumb"
              />
              <div className="detail-info">
                <span className="detail-label">SERVICE</span>
                <h4 className="detail-value">{order.subcategory_name}</h4>
              </div>
            </div>
            <div className="service-detail-row no-border">
              <img 
                src={order.category_image ? `${LEGACY_ASSETS_BASE_URL}/uploads/category/${order.category_image}` : 'https://placehold.co/100x100?text=Category'}
                alt={order.category_name} 
                className="detail-thumb"
              />
              <div className="detail-info">
                <span className="detail-label">CATEGORY</span>
                <h4 className="detail-value">{order.category_name}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Service Address */}
        <div className="od-section">
          <div className="od-card-header">
            <div className="od-card-icon-container pink">
              <MapPin size={18} color="#e50942" />
            </div>
            <h3 className="od-card-title">Service Address</h3>
          </div>
          <div className="od-card-content">
            <p className="address-text">{getFullAddress()}</p>
          </div>
        </div>

        {/* Partner Information */}
        {partner && (
          <div className="od-section">
            <div className="od-card-header">
              <div className="od-card-icon-container green">
                <UserCheck size={18} color="#16a34a" />
              </div>
              <h3 className="od-card-title">Partner Information</h3>
            </div>
            <div className="od-card-content">
              <div className="partner-row">
                <div className="partner-avatar">{(partner.name || 'P').charAt(0).toUpperCase()}</div>
                <div className="partner-meta">
                  <h4>{partner.name}</h4>
                  <div className="partner-rating-line">
                    <StaticStars value={partner.avg_rating} />
                    <span className="partner-rating-value">{partner.avg_rating.toFixed(1)}</span>
                    <span className="partner-review-count">({partner.review_count} review{partner.review_count === 1 ? '' : 's'})</span>
                  </div>
                </div>
              </div>

              {partner.phone && (
                <a className="partner-call-btn" href={`tel:${partner.phone}`}>
                  <Phone size={18} />
                  <div>
                    <span className="call-label">CALL NOW</span>
                    <span className="call-number">{partner.phone}</span>
                  </div>
                </a>
              )}

              {(partner.area_locality || partner.city) && (
                <p className="partner-location-line">
                  <MapPin size={14} />
                  {[partner.area_locality, partner.city, partner.state].filter(Boolean).join(', ')}
                  {partner.coverage_area ? ` · Serves within ${partner.coverage_area} km` : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Your Rating */}
        {rating && (
          <div className="od-section">
            <div className="od-card-header">
              <div className="od-card-icon-container yellow">
                <Star size={18} color="#eab308" />
              </div>
              <h3 className="od-card-title">Your Rating</h3>
            </div>
            <div className="od-card-content">
              <div className="rating-summary-row">
                <StaticStars value={rating.overall_rating} size={20} />
                <span className="rating-summary-value">{rating.overall_rating}.0 Overall</span>
              </div>
              <div className="rating-breakdown">
                <span>Service Quality: {rating.quality_rating}/5</span>
                <span>Behaviour: {rating.behaviour_rating}/5</span>
                <span>Timeliness: {rating.on_time_rating}/5</span>
              </div>
              {rating.comment && <p className="rating-comment-text">"{rating.comment}"</p>}
            </div>
          </div>
        )}

        {canRate && (
          <div className="od-section">
            <button className="od-rate-now-btn" onClick={() => setShowRatingModal(true)}>
              <Star size={18} /> Rate This Order
            </button>
          </div>
        )}

        {isCancellable && (
          <div className="od-cancel-section">
            <button className="od-cancel-btn" onClick={() => setCancelModalOpen(true)}>
              <XCircle size={18} /> Cancel Order
            </button>
          </div>
        )}
      </div>

      {renderCancelModal()}
      {renderRatingTeaser()}
      {renderRatingModal()}

      <BottomNav />
    </div>
  );
};

export default OrderDetails;
