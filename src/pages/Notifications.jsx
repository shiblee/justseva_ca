import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Clock, CheckCheck } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import { getNotifications, markNotificationRead, markAllNotificationsRead, LEGACY_ASSETS_BASE_URL } from '../services/api';
import './Notifications.css';

const SUBCATEGORY_IMAGE_BASE = `${LEGACY_ASSETS_BASE_URL}/uploads/sub-category/`;

// Stored link_url values point at the legacy PHP site (e.g.
// http://localhost:8888/justseva/view_order/Mzg=) - translate them onto this app's own routes
// instead of navigating to them directly (react-router can't follow an absolute external URL).
const resolveNotificationPath = (linkUrl) => {
  if (!linkUrl) return null;
  try {
    const url = new URL(linkUrl, window.location.origin);
    const path = url.pathname.replace(/^\/justseva\//, '').replace(/^\//, '');

    const orderMatch = path.match(/^view_order\/(.+)$/);
    if (orderMatch) return `/order-details/${orderMatch[1]}`;

    if (path === 'testimonial') return '/testimonial';

    return null;
  } catch {
    return null;
  }
};

const formatDateGroup = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const data = await getNotifications(token);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    const path = resolveNotificationPath(notif.link_url);

    if (!notif.is_read) {
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n)));
      try {
        await markNotificationRead(notif.id, localStorage.getItem('token'));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    if (path) navigate(path);
  };

  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    try {
      await markAllNotificationsRead(localStorage.getItem('token'));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      setNotifications(previous);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Group into date buckets, preserving the newest-first order already returned by the API.
  const groups = notifications.reduce((acc, notif) => {
    const label = formatDateGroup(notif.created_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(notif);
    return acc;
  }, {});

  return (
    <div className="notifications-page">
      <TopBar />

      <div className="notifications-page-header">
        <PageHeader
          title="Notifications"
          badge={unreadCount > 0 ? `${unreadCount} Unread` : null}
        />
        {unreadCount > 0 && (
          <button className="ntf-mark-all-btn" onClick={handleMarkAllRead} disabled={markingAll}>
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="notifications-content">
        {loading ? (
          <div className="nt-loading">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="nt-empty">
            <div className="nt-empty-icon">
              <Bell size={48} color="#cbd5e1" />
            </div>
            <h3>No Notifications</h3>
            <p>You don't have any notifications right now.</p>
          </div>
        ) : (
          Object.entries(groups).map(([dateLabel, items]) => (
            <div className="ntf-date-group" key={dateLabel}>
              <div className="ntf-date-heading">
                <span>{dateLabel}</span>
                <div className="ntf-date-line" />
              </div>

              {items.map((notif) => {
                const isUnread = !notif.is_read;
                return (
                  <div
                    key={notif.id}
                    className={`ntf-card ${isUnread ? 'unread' : 'read'}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="ntf-card-media">
                      {notif.subcategory_image ? (
                        <img src={`${SUBCATEGORY_IMAGE_BASE}${notif.subcategory_image}`} alt={notif.subcategory_name || notif.title} />
                      ) : (
                        <div className="ntf-card-media-fallback">
                          <Bell size={26} />
                        </div>
                      )}
                    </div>

                    <div className="ntf-card-body">
                      <div className="ntf-card-top">
                        <span className="ntf-pill">
                          <span className="ntf-pill-dot" />
                          {notif.title}
                        </span>
                        {isUnread && <span className="ntf-new-badge">New</span>}
                      </div>

                      <h3 className="ntf-subcat">{notif.subcategory_name || notif.title}</h3>
                      <p className="ntf-message">{notif.message}</p>

                      <div className="ntf-meta-row">
                        {notif.order_no && <span className="ntf-order-pill">#{notif.order_no}</span>}
                        <span className="ntf-time">
                          <Clock size={12} />
                          {formatTime(notif.created_at)}
                        </span>
                      </div>
                    </div>

                    {isUnread && <span className="ntf-unread-dot" />}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Notifications;
