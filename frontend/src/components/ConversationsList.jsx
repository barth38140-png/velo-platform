import React, { useState, useEffect } from 'react';
import { conversationService } from '../services/api';
import ChatDemoSocket from './ChatDemoSocket';

/**
 * Liste des conversations + chat temps réel
 */
const ConversationsList = ({ token, userId, initialConversationId }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Charger les conversations sans setState initial (éviter cascading renders)
    conversationService.getConversations()
      .then(res => {
        const data = res.data?.conversations || [];
        setConversations(data);
        // Auto-sélectionner si un id initial est fourni
        if (initialConversationId) {
          const exists = data.find(c => String(c.id) === String(initialConversationId));
          if (exists) setSelectedConv(exists.id);
          else setSelectedConv(null);
        }
      })
      .catch(() => {
        setConversations([]);
      });
  }, [initialConversationId]);

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ minWidth: 220 }}>
        <h3>Mes conversations</h3>
        {loading && <div>Chargement...</div>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {conversations.map(conv => (
            <li key={conv.id}>
              <button
                style={{ width: '100%', textAlign: 'left', padding: 8, background: selectedConv === conv.id ? '#e0e0e0' : '#fff', border: '1px solid #ccc', marginBottom: 4 }}
                onClick={() => setSelectedConv(conv.id)}
              >
                Conversation #{conv.id} <br />
                Client: {conv.client_id} / Réparateur: {conv.repairer_id}
              </button>
            </li>
          ))}
          {conversations.length === 0 && !loading && <li>Aucune conversation</li>}
        </ul>
      </div>
      <div style={{ flex: 1 }}>
        {selectedConv ? (
          <ChatDemoSocket conversationId={selectedConv} token={token} userId={userId} />
        ) : (
          <div>Sélectionnez une conversation pour discuter.</div>
        )}
      </div>
    </div>
  );
};

export default ConversationsList;
