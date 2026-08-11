import React, { useState } from 'react';
import { getPage } from '../services/api';
import './Footer.css';

const Footer = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '' });

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

  return (
    <>
      <footer className="justseva-footer">
        <div className="footer-content">
          <div className="footer-links">
            <span className="footer-link" onClick={() => handleOpenPage(2)}>Terms & Conditions</span>
            <span className="footer-divider">•</span>
            <span className="footer-link" onClick={() => handleOpenPage(1)}>Privacy Policy</span>
            <span className="footer-divider">•</span>
            <span className="footer-link">Support</span>
          </div>
          <p className="copyright-text">
            Copyright © {new Date().getFullYear()}, Just Seva Private Limited. All Rights Reserved.
          </p>
        </div>
      </footer>

      {modalOpen && (
        <div className="page-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="page-modal-content" onClick={e => e.stopPropagation()}>
            <div className="page-modal-header">
              <h2>{modalContent.title}</h2>
              <button className="page-modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="page-modal-body" dangerouslySetInnerHTML={{ __html: modalContent.description }} />
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
