import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, Check, X, Eye, CheckCircle2, XCircle, Info } from 'lucide-react';
import { getActionRequiredRefunds, confirmServiceStatus } from '../services/api';
import './ActionRequiredBanner.css';

// Onboarding page a customer can land on before their profile (and any real
// order history) exists - the refund confirmation banner doesn't apply there.
const SKIP_PATHS = ['/profile-completion'];

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
  return date.toLocaleString('en-GB', options).replace(',', ',');
};

const ActionRequiredBanner = () => {
  const location = useLocation();
  const skip = SKIP_PATHS.includes(location.pathname);

  const [refunds, setRefunds] = useState([]);
  const [pendingConfirm, setPendingConfirm] = useState(null); // { refund, response }
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

  const loadRefunds = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || skip) {
      setRefunds([]);
      return;
    }
    try {
      const data = await getActionRequiredRefunds(token);
      setRefunds(data.refunds || []);
    } catch (err) {
      console.error('Failed to load action-required refunds:', err);
    }
  }, [skip]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  if (skip || (refunds.length === 0 && !feedback)) return null;

  const openConfirm = (refund, response) => setPendingConfirm({ refund, response });

  const handleConfirm = async () => {
    if (!pendingConfirm || submitting) return;
    const { refund, response } = pendingConfirm;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await confirmServiceStatus(refund.refund_id, refund.order_id, response, token);
      setPendingConfirm(null);
      setFeedback({ type: 'success', message: res.message });
      await loadRefunds();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const isYes = pendingConfirm?.response === 'yes';

  return (
    <div className="arb-wrapper">
      {refunds.length > 0 && (
        <div className="arb-section">
          <div className="arb-section-title">
            <AlertCircle size={16} />
            Action Required ({refunds.length})
          </div>

          {refunds.map((r) => {
            const partnerName = r.partner_name || 'Partner';
            const partnerInitial = partnerName.charAt(0).toUpperCase();
            return (
              <div className="arb-card" key={r.refund_id}>
                <div className="arb-card-row">
                  <div className="arb-avatar">{partnerInitial}</div>
                  <div className="arb-card-body">
                    <p className="arb-question">
                      <strong>{partnerName}</strong> has requested a refund, saying the service was never started — has the partner started the service?
                    </p>

                    {r.refund_reason && (
                      <p className="arb-reason-box">
                        <strong>Reason:</strong> {r.refund_reason}
                        {r.refund_remarks && (<><br /><strong>Remarks:</strong> {r.refund_remarks}</>)}
                        {r.refund_created_at && (<><br /><span className="arb-muted">Requested on {formatDate(r.refund_created_at)}</span></>)}
                      </p>
                    )}

                    <div className="arb-pills">
                      <span className="arb-pill">#{r.order_no}</span>
                      {r.category_name && <span className="arb-pill">{r.category_name}</span>}
                      {r.subcategory_name && <span className="arb-pill">{r.subcategory_name}</span>}
                    </div>

                    <div className="arb-actions">
                      <button type="button" className="arb-btn-yes" onClick={() => openConfirm(r, 'yes')}>
                        <Check size={14} /> Yes, service started
                      </button>
                      <button type="button" className="arb-btn-no" onClick={() => openConfirm(r, 'no')}>
                        <X size={14} /> No, not started
                      </button>
                      <Link to={`/order-details/${btoa(String(r.order_id))}`} className="arb-btn-no arb-btn-view">
                        <Eye size={14} /> View order
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pendingConfirm && (
        <div className="arb-modal-overlay" onClick={() => !submitting && setPendingConfirm(null)}>
          <div className="arb-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`arb-modal-icon ${isYes ? 'yes' : 'no'}`}>
              {isYes ? <CheckCircle2 size={30} /> : <XCircle size={30} />}
            </div>
            <h3 className="arb-modal-title">{isYes ? 'Partner started the service?' : 'Service was not started?'}</h3>
            <p className="arb-modal-subtitle">
              {isYes ? "You're confirming the partner started the service." : "You're confirming the partner never started the service."}
            </p>
            <div className="arb-modal-info">
              <Info size={14} />
              <span>
                {isYes
                  ? "The partner's refund request will be declined and their acceptance fee will not be returned."
                  : "The partner's refund request will be approved and their acceptance fee will be credited back to their wallet."}
                {' '}This response cannot be changed.
              </span>
            </div>
            <div className="arb-modal-actions">
              <button type="button" className="arb-modal-cancel" onClick={() => setPendingConfirm(null)} disabled={submitting}>
                Go Back
              </button>
              <button type="button" className={isYes ? 'arb-modal-confirm-yes' : 'arb-modal-confirm-no'} onClick={handleConfirm} disabled={submitting}>
                {submitting ? 'Submitting...' : (isYes ? <><Check size={14} /> Yes, service started</> : <><X size={14} /> No, not started</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div className="arb-modal-overlay" onClick={() => setFeedback(null)}>
          <div className="arb-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`arb-modal-icon ${feedback.type === 'success' ? 'yes' : 'no'}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={30} /> : <XCircle size={30} />}
            </div>
            <h3 className="arb-modal-title">{feedback.type === 'success' ? 'Done!' : 'Error'}</h3>
            <p className="arb-modal-subtitle">{feedback.message}</p>
            <div className="arb-modal-actions">
              <button type="button" className="arb-modal-confirm-yes" onClick={() => setFeedback(null)} style={{ width: '100%' }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionRequiredBanner;
