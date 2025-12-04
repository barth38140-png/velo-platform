import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import '../../styles/AdminComponents.css';

export default function ModerationPanel() {
  const [activeTab, setActiveTab] = useState('reviews');
  const [reviews, setReviews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [moderationNote, setModerationNote] = useState('');
  const [moderationAction, setModerationAction] = useState('approve');
  const toast = useToast();

  useEffect(() => {
    loadFlaggedContent();
  }, [activeTab]);

  const loadFlaggedContent = async () => {
    try {
      setLoading(true);
      if (activeTab === 'reviews') {
        const res = await adminService.getFlaggedReviews();
        setReviews(res.data.reviews || []);
      } else {
        const res = await adminService.getFlaggedMessages();
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      toast.error('Erreur lors du chargement du contenu signalé');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (itemId, action) => {
    try {
      if (activeTab === 'reviews') {
        await adminService.moderateReview(itemId, {
          action,
          moderation_note: moderationNote
        });
      } else {
        await adminService.moderateMessage(itemId, {
          action,
          moderation_note: moderationNote
        });
      }
      toast.success('Contenu modéré avec succès');
      setSelectedItem(null);
      setModerationNote('');
      loadFlaggedContent();
    } catch (err) {
      toast.error('Erreur lors de la modération');
    }
  };

  const data = activeTab === 'reviews' ? reviews : messages;
  const contentKey = activeTab === 'reviews' ? 'review_text' : 'message_text';
  const authorKey = activeTab === 'reviews' ? 'reviewer_name' : 'sender_name';

  return (
    <div className="moderation-panel">
      <h2>📋 Modération du contenu</h2>

      <div className="mod-tabs">
        <button
          className={`mod-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          ⭐ Avis ({reviews.length})
        </button>
        <button
          className={`mod-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          💬 Messages ({messages.length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <p>✅ Aucun contenu signalé à modérer</p>
        </div>
      ) : (
        <div className="moderation-list">
          {data.map(item => (
            <div key={item.id} className="flagged-item">
              <div className="item-header">
                <strong>{item[authorKey]}</strong>
                <span className="flag-count">🚩 {item.flag_count} signalement(s)</span>
              </div>

              <div className="item-content">
                <p>{item[contentKey]}</p>
                <div className="flag-reasons">
                  {item.reasons?.map((reason, idx) => (
                    <span key={idx} className="reason-badge">{reason}</span>
                  ))}
                </div>
              </div>

              <div className="item-actions">
                {selectedItem === item.id ? (
                  <div className="moderation-form">
                    <textarea
                      placeholder="Note de modération (optionnelle)"
                      value={moderationNote}
                      onChange={(e) => setModerationNote(e.target.value)}
                      rows="3"
                    />

                    <div className="mod-actions">
                      <button
                        className="btn btn-success"
                        onClick={() => handleModerate(item.id, 'approve')}
                      >
                        ✅ Approuver
                      </button>
                      <button
                        className="btn btn-warning"
                        onClick={() => handleModerate(item.id, 'reject')}
                      >
                        ⚠️ Rejeter
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleModerate(item.id, 'delete')}
                      >
                        🗑️ Supprimer
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSelectedItem(null)}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => setSelectedItem(item.id)}
                  >
                    Modérer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
