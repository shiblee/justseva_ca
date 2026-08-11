import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import PageHeader from '../components/PageHeader';
import BottomNav from '../components/BottomNav';
import Button from '../components/Button';
import Input from '../components/Input';
import { Plus, MessageSquare, Paperclip, Send, X, Inbox, Check } from 'lucide-react';
import { createSupportTicket, getSupportTickets, getTicketDetails, replyToSupportTicket } from '../services/api';
import './EditProfile.css';
import './Support.css';

const Support = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const chatFileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const [activeTab, setActiveTab] = useState('my-tickets'); // 'create' or 'my-tickets'
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  
  // Create Form State
  const [ticketType, setTicketType] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);

  // Chat Modal State
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatAttachments, setChatAttachments] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [modalState, setModalState] = useState({ show: false, type: 'success', title: '', message: '' });

  const showModal = (type, title, message) => {
    setModalState({ show: true, type, title, message });
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await getSupportTickets(token);
      setTickets(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketNo) => {
    try {
      const token = localStorage.getItem('token');
      const res = await getTicketDetails(ticketNo, token);
      setActiveTicket(res.data.ticket);
      setMessages(res.data.messages || []);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      showModal('error', 'Error', err.message || 'Failed to refresh ticket.');
    }
  };

  const handleFileChange = (e, isChat = false) => {
    const files = Array.from(e.target.files);
    if (isChat) {
      if (chatAttachments.length + files.length > 5) {
        showModal('error', 'Limit Reached', "You can only attach a maximum of 5 files.");
        return;
      }
      setChatAttachments([...chatAttachments, ...files]);
    } else {
      if (attachments.length + files.length > 5) {
        showModal('error', 'Limit Reached', "You can only attach a maximum of 5 files.");
        return;
      }
      setAttachments([...attachments, ...files]);
    }
  };

  const removeAttachment = (index, isChat = false) => {
    if (isChat) {
      const newAtt = [...chatAttachments];
      newAtt.splice(index, 1);
      setChatAttachments(newAtt);
    } else {
      const newAtt = [...attachments];
      newAtt.splice(index, 1);
      setAttachments(newAtt);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketType || !subject || !description) {
      showModal('error', 'Missing Fields', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('ticket_type', ticketType);
      formData.append('subject', subject);
      formData.append('description', description);
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      await createSupportTicket(formData, token);
      
      // Reset form
      setTicketType('');
      setSubject('');
      setDescription('');
      setAttachments([]);
      
      setActiveTab('my-tickets');
      fetchTickets();
      showModal('success', 'Ticket Created', 'Your support ticket has been created successfully!');
    } catch (err) {
      showModal('error', 'Submission Failed', err.message || 'Failed to create ticket.');
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (ticketNo) => {
    try {
      setLoading(true);
      await fetchTicketDetails(ticketNo);
    } catch (err) {
      showModal('error', 'Error', err.message || 'Failed to open ticket details.');
    } finally {
      setLoading(false);
    }
  };

  const closeChat = () => {
    setActiveTicket(null);
    setMessages([]);
    setReplyMessage('');
    setChatAttachments([]);
  };

  const handleReply = async () => {
    if (!replyMessage.trim() && chatAttachments.length === 0) {
      showModal('error', 'Empty Message', 'Please enter a message or attach a file.');
      return;
    }

    try {
      setSendingReply(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('message', replyMessage);
      chatAttachments.forEach(file => {
        formData.append('attachments', file);
      });

      await replyToSupportTicket(activeTicket.ticket_no, formData, token);
      
      setReplyMessage('');
      setChatAttachments([]);
      fetchTicketDetails(activeTicket.ticket_no);
    } catch (err) {
      showModal('error', 'Reply Failed', err.message || 'Failed to send message.');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="edit-profile-page support-specific-overrides">
      <TopBar />
      
      <div className="edit-profile-container">
        <PageHeader title="Contact Support" onBack={() => navigate('/profile')} />

        <div className="support-tabs" style={{ marginBottom: '24px' }}>
            <div 
              className={`support-tab ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              <div className="tab-icon-wrapper create-icon"><Plus size={16} color="#fff" /></div>
              <span>Create Ticket</span>
            </div>
            <div 
              className={`support-tab ${activeTab === 'my-tickets' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-tickets')}
            >
              <div className="tab-icon-wrapper list-icon"><Inbox size={16} color="#fff" /></div>
              <span>My Tickets</span>
              {tickets.length > 0 && <span className="ticket-count">{tickets.length}</span>}
            </div>
          </div>

        <div className="support-content">
          {activeTab === 'create' && (
            <div className="create-ticket-card">
              
              <div className="form-group">
                <label className="ep-label">Ticket Type <span className="required">*</span></label>
                <div className="select-wrapper">
                  <select 
                    value={ticketType} 
                    onChange={(e) => setTicketType(e.target.value)}
                    className="custom-select"
                  >
                    <option value="">— Select type —</option>
                    <option value="service">Service Request</option>
                    <option value="order">Order Issue</option>
                    <option value="payment">Payment Issue</option>
                    <option value="general">General Enquiry</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <Input 
                  label="Subject *" 
                  placeholder="Brief summary of your issue" 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <Input 
                  label="Description *" 
                  placeholder="Describe your issue in detail..." 
                  multiline 
                  rows={4}
                  maxLength={500}
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                />
                <div style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'right', marginTop: '4px', paddingRight: '4px' }}>
                  {description.length}/500 characters
                </div>
              </div>

              <div className="form-group">
                <label className="ep-label">Attachments <span className="optional">(optional, max 5)</span></label>
                <div className="upload-box" onClick={() => fileInputRef.current.click()}>
                  <Paperclip size={24} color="#94a3b8" style={{ marginBottom: '8px' }} />
                  <p><strong>Click to attach</strong> or drag files here</p>
                </div>
                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleFileChange(e, false)} 
                />
                
                {attachments.length > 0 && (
                  <div className="attachments-list">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="attachment-chip">
                        <span>{file.name}</span>
                        <X size={14} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => removeAttachment(idx, false)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                variant="primary" 
                onClick={handleCreateTicket} 
                loading={loading}
                style={{ width: '100%', marginTop: '12px' }}
              >
                Submit Ticket
              </Button>
            </div>
          )}

          {activeTab === 'my-tickets' && (
            <div className="my-tickets-list">
              {loading && tickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="empty-state">
                  <Inbox size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                  <p>You have no open tickets.</p>
                </div>
              ) : (
                tickets.map(ticket => (
                  <div key={ticket.id} className="ticket-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }}>
                    {/* Header: ID and Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, fontFamily: 'monospace' }}>#{ticket.ticket_no}</span>
                       <div style={{ display: 'flex', gap: '8px' }}>
                         {ticket.status === 'pending' && <span style={{ padding: '4px 10px', fontSize: '0.65rem', borderRadius: '6px', background: '#fee2e2', color: '#dc2626', fontWeight: 700, letterSpacing: '0.5px' }}>NEW</span>}
                         <span style={{ padding: '4px 10px', fontSize: '0.65rem', borderRadius: '6px', background: ticket.status === 'closed' ? '#f1f5f9' : '#fff3cd', color: ticket.status === 'closed' ? '#475569' : '#856404', fontWeight: 700, textTransform: 'uppercase' }}>{ticket.status}</span>
                       </div>
                    </div>
                  
                    {/* Body: Subject and Meta */}
                    <div>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#0f172a', lineHeight: 1.4, fontWeight: 700 }}>{ticket.subject}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                         <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 600, textTransform: 'capitalize' }}>{ticket.ticket_type}</span>
                         <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>•</span>
                         <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                           {new Date(ticket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })},{' '}
                           {new Date(ticket.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                         </span>
                      </div>
                    </div>
                  
                    {/* Footer: Chat Button */}
                    <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                       <Button variant="outline" onClick={() => openChat(ticket.ticket_no)} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', fontSize: '13px', borderRadius: '12px', border: '1px solid rgba(229, 9, 66, 0.2)', color: '#e50942', background: '#fff0f3', fontWeight: 600, minHeight: '38px', height: 'auto', boxShadow: 'none' }}>
                          <MessageSquare size={16} /> Open Chat
                          {ticket.unread_count > 0 && (
                            <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e50942', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(229, 9, 66, 0.4)' }}>{ticket.unread_count}</span>
                          )}
                       </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {activeTicket && (
        <div className="chat-modal-overlay">
          <div className="chat-modal">
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={20} color="#e50942" />
                <div>
                  <h3 style={{ margin: 0 }}>Conversation</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Ticket #{activeTicket.ticket_no}</p>
                </div>
              </div>
              <div className="close-btn" onClick={closeChat}>
                <X size={24} color="#64748b" />
              </div>
            </div>

            <div className="chat-body">
              <div className="message-bubble customer">
                <div className="bubble-content">{activeTicket.description}</div>
                <div className="bubble-time">
                  {new Date(activeTicket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })},{' '}
                  {new Date(activeTicket.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </div>
              </div>

              {messages.map(msg => (
                <div key={msg.id} className={`message-bubble ${msg.sender_type}`}>
                  <div className="bubble-content">{msg.message}</div>
                  <div className="bubble-time">
                    {new Date(msg.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })},{' '}
                    {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-footer">
              {chatAttachments.length > 0 && (
                <div className="chat-attachments-preview">
                  {chatAttachments.map((file, idx) => (
                     <div key={idx} className="attachment-chip mini">
                       <span>{file.name}</span>
                       <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeAttachment(idx, true)} />
                     </div>
                  ))}
                </div>
              )}
              <div className="chat-input-row">
                <div className="attachment-btn" onClick={() => chatFileInputRef.current.click()}>
                  <Paperclip size={20} color="#64748b" />
                </div>
                <input 
                  type="file" 
                  multiple 
                  ref={chatFileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleFileChange(e, true)} 
                />
                <input 
                  type="text" 
                  className="chat-input"
                  placeholder="Type your message..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                />
                <button className="send-btn" onClick={handleReply} disabled={sendingReply || (!replyMessage.trim() && chatAttachments.length === 0)}>
                  <Send size={18} color="#fff" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalState.show && (
        <div className="custom-modal-overlay" style={{ zIndex: 10000 }}>
          <div className="custom-modal centered">
            <div className="custom-modal-header" style={{ flexDirection: 'column', gap: '16px' }}>
              <div className={`icon-circle ${modalState.type === 'error' ? 'error' : 'success'}`}>
                {modalState.type === 'error' ? <X size={32} /> : <Check size={32} />}
              </div>
              <h3 style={{ margin: 0, color: '#0f172a' }}>{modalState.title}</h3>
              <div className="close-btn" onClick={() => setModalState({ ...modalState, show: false })} style={{ cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </div>
            </div>
            <div className="custom-modal-body">
              <p style={{ margin: 0, color: '#475569', lineHeight: '1.6', fontSize: '15px' }}>
                {modalState.message}
              </p>
            </div>
            <div className="custom-modal-footer">
              <Button variant="primary" onClick={() => setModalState({ ...modalState, show: false })}>OK</Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Support;
