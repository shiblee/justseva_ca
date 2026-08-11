import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Star, CheckCircle2 } from 'lucide-react';
import { getPendingRating, submitRating } from '../services/api';
import '../pages/OrderDetails.css';

const DISMISS_PREFIX = 'global_rating_prompt_dismissed_';

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

const formatDateOnly = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Follows the customer around the app (unlike the Order Details page's own rating prompt,
// which only fires when they happen to be looking at that specific order) so a completed
// order doesn't go unrated just because they never revisit it. "Maybe Later" only dismisses
// for the current browser session (sessionStorage) - it reappears next time the app is
// opened if still unrated, per product decision that this stays persistent until rated.
const RatingPromptModal = () => {
  const location = useLocation();
  // Order Details already has its own dedicated teaser/rating flow for the order being
  // viewed - skip here entirely to avoid two rating prompts stacking on top of each other.
  // Also skip the onboarding page - a customer there can't have a completed order yet.
  const skipPage = location.pathname.startsWith('/order-details/') || location.pathname === '/profile-completion';

  const [pendingOrder, setPendingOrder] = useState(null);
  const [showTeaser, setShowTeaser] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [ratingForm, setRatingForm] = useState({ quality: 0, behaviour: 0, onTime: 0, comment: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (skipPage) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    let cancelled = false;
    getPendingRating(token)
      .then((data) => {
        if (cancelled) return;
        const order = data.order;
        if (order && sessionStorage.getItem(DISMISS_PREFIX + order.order_id) !== '1') {
          setPendingOrder(order);
          setShowTeaser(true);
        }
      })
      .catch((err) => console.error('Failed to load pending rating:', err));

    return () => { cancelled = true; };
  }, [skipPage]);

  const dismissTeaser = useCallback(() => {
    if (pendingOrder) sessionStorage.setItem(DISMISS_PREFIX + pendingOrder.order_id, '1');
    setShowTeaser(false);
  }, [pendingOrder]);

  const submitRatingForm = async () => {
    const { quality, behaviour, onTime, comment } = ratingForm;
    if (!quality || !behaviour || !onTime) {
      setFormError('Please rate all three categories.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const token = localStorage.getItem('token');
      await submitRating(pendingOrder.order_id, {
        qualityRating: quality,
        behaviourRating: behaviour,
        onTimeRating: onTime,
        comment
      }, token);
      sessionStorage.removeItem(DISMISS_PREFIX + pendingOrder.order_id);
      setShowForm(false);
      setPendingOrder(null);
    } catch (err) {
      setFormError(err.message || 'Failed to submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  if (skipPage || !pendingOrder) return null;

  return (
    <>
      {showTeaser && (
        <div className="modal-overlay">
          <div className="modal-content rating-teaser-modal">
            <button className="close-modal-btn" onClick={dismissTeaser}>✕</button>

            <div className="teaser-header">
              <div className="teaser-stars">
                <StaticStars value={5} size={30} />
              </div>
              <h3>How was your service?</h3>
              <p>Your feedback helps {pendingOrder.partner_name || 'our partner'} and other customers.</p>
            </div>

            <div className="teaser-service-card">
              <div className="teaser-service-icon">
                <CheckCircle2 size={20} color="#e50942" />
              </div>
              <div>
                <h4>{pendingOrder.subcategory_name}</h4>
                <p>#{pendingOrder.order_no} · by {pendingOrder.partner_name || 'Partner'} · {formatDateOnly(pendingOrder.completed_at || pendingOrder.created_at)}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn outline-btn" onClick={dismissTeaser}>
                Maybe Later
              </button>
              <button
                className="modal-btn primary-btn"
                onClick={() => { setShowTeaser(false); setShowForm(true); }}
              >
                <Star size={16} /> Rate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content rate-order-modal">
            <div className="rate-order-header">
              <h3><Star size={18} /> Rate Order <span>#{pendingOrder.order_no}</span></h3>
              <button className="close-modal-btn" onClick={() => setShowForm(false)} disabled={submitting}>✕</button>
            </div>

            <div className="rate-order-body">
              <div className="rate-field">
                <label>Service Quality</label>
                <StarPicker value={ratingForm.quality} onChange={(v) => setRatingForm((prev) => ({ ...prev, quality: v }))} />
              </div>

              <div className="rate-field">
                <label>Partner Behaviour / Professionalism</label>
                <StarPicker value={ratingForm.behaviour} onChange={(v) => setRatingForm((prev) => ({ ...prev, behaviour: v }))} />
              </div>

              <div className="rate-field">
                <label>Timeliness / Punctuality</label>
                <StarPicker value={ratingForm.onTime} onChange={(v) => setRatingForm((prev) => ({ ...prev, onTime: v }))} />
              </div>

              <div className="rate-field">
                <div className="rate-field-header">
                  <label>Comment (optional)</label>
                  <span className="char-count">{ratingForm.comment.length}/500</span>
                </div>
                <textarea
                  className="rate-comment-input"
                  placeholder="Write your feedback..."
                  value={ratingForm.comment}
                  maxLength={500}
                  onChange={(e) => setRatingForm((prev) => ({ ...prev, comment: e.target.value }))}
                />
              </div>

              {formError && <div className="field-error">{formError}</div>}
            </div>

            <div className="modal-actions sticky-actions">
              <button
                className="modal-btn outline-btn"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Close
              </button>
              <button
                className="modal-btn primary-btn"
                onClick={submitRatingForm}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RatingPromptModal;
