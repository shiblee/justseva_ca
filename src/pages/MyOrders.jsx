import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Clock, XCircle, AlertCircle } from 'lucide-react';
import { getAllOrders, cancelOrder, LEGACY_ASSETS_BASE_URL } from '../services/api';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import './MyOrders.css';

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // For cancellation modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await getAllOrders(token);
      let fetchedOrders = data.orders || [];
      fetchedOrders.sort((a, b) => {
        const aIsCancelled = a.status.includes('Cancel');
        const bIsCancelled = b.status.includes('Cancel');
        if (aIsCancelled && !bIsCancelled) return 1;
        if (!aIsCancelled && bIsCancelled) return -1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setOrders(fetchedOrders);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDateTime = (dateString) => {
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

  const handleCancelClick = (order) => {
    setOrderToCancel(order);
    setCancelModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!orderToCancel) return;
    
    setIsCancelling(true);
    try {
      const token = localStorage.getItem('token');
      await cancelOrder(orderToCancel.order_id, token);
      
      // Update local state to reflect cancellation
      const updatedOrders = orders.map(o => 
        o.order_id === orderToCancel.order_id 
          ? { ...o, status: 'Cancelled' } 
          : o
      );
      updatedOrders.sort((a, b) => {
        const aIsCancelled = a.status.includes('Cancel');
        const bIsCancelled = b.status.includes('Cancel');
        if (aIsCancelled && !bIsCancelled) return 1;
        if (!aIsCancelled && bIsCancelled) return -1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setOrders(updatedOrders);
      
      setCancelModalOpen(false);
      setOrderToCancel(null);
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
        <div className="modal-content cancel-modal">
          <div className="modal-icon-container warning">
            <AlertCircle size={32} className="warning-icon" />
          </div>
          <h3 className="modal-title">Cancel Order?</h3>
          <p className="modal-message">
            Are you sure you want to cancel order <strong>#{orderToCancel?.order_no}</strong>? This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button 
              className="modal-btn outline-btn" 
              onClick={() => {
                setCancelModalOpen(false);
                setOrderToCancel(null);
              }}
              disabled={isCancelling}
            >
              No, Keep It
            </button>
            <button 
              className="modal-btn danger-btn" 
              onClick={confirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="my-orders-page loading">
        <TopBar />
        <div className="loading-spinner"></div>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-orders-page error">
        <TopBar />
        <div className="error-message">
          <AlertCircle size={40} />
          <p>{error}</p>
          <button onClick={fetchOrders} className="retry-btn">Retry</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <TopBar />

      <div className="my-orders-page-header">
        <PageHeader
          title="My Orders"
          subtitle="All your service bookings"
          badge={`${orders.length} order${orders.length !== 1 ? 's' : ''}`}
          showBack={false}
        />
      </div>

      <div className="orders-content">
        <div className="status-filter">
          <div className="status-tab active">
            <Clock size={14} /> Service Requested
            <span className="tab-count">
              {orders.filter(o => o.status === 'Service Requested').length}
            </span>
          </div>
        </div>

        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="no-orders">
              <ShoppingBag size={48} className="no-orders-icon" />
              <h3>No orders yet</h3>
              <p>You haven't booked any services yet.</p>
              <button className="book-now-btn" onClick={() => navigate('/dashboard')}>
                Book a Service
              </button>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.order_id} className="order-card">
                <div className="order-card-body">
                  <div className="order-image-container">
                    <img 
                      src={order.subcategory_image ? `${LEGACY_ASSETS_BASE_URL}/uploads/sub-category/${order.subcategory_image}` : 'https://placehold.co/100x100?text=Service'}
                      alt={order.subcategory_name} 
                      className="order-image"
                    />
                  </div>
                  
                  <div className="order-info">
                    <h3 className="order-title">{order.subcategory_name}</h3>
                    <p className="order-category">{order.category_name}</p>
                    <span className="order-number-text">#{order.order_no}</span>
                  </div>

                  <div className="order-top-right">
                    <div className={`order-status-badge ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      <span className="status-dot"></span>
                      {order.status}
                    </div>
                    <button 
                      className="view-link-btn"
                      onClick={() => navigate(`/order-details/${btoa(order.order_id.toString())}`)}
                    >
                      View <span className="arrow-icon">→</span>
                    </button>
                  </div>
                </div>
                
                <div className="order-actions-bottom">
                  <div className="order-actions-left">
                    <div className="order-datetime">
                      <Clock size={12} /> {formatDateTime(order.created_at)}
                    </div>
                  </div>
                  <div className="order-actions-right">
                    {!order.status.includes('Cancel') && order.status !== 'Completed' && (
                      <button 
                        className="cancel-btn"
                        onClick={() => handleCancelClick(order)}
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {renderCancelModal()}
      <BottomNav />
    </div>
  );
};

export default MyOrders;
