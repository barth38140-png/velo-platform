import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Composant de démonstration pour la messagerie client ↔ réparateur
 * Utilise l'API REST (sans Socket.io pour la première version)
 */
const ChatDemo = ({ conversationId, token }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Récupère les messages au chargement
  useEffect(() => {
    if (!conversationId) return;
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/conversations/${conversationId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data.messages);
      } catch (e) {
        setMessages([]);
      }
    };
    fetchMessages();
  }, [conversationId, token]);

  // Envoie un message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      await axios.post(`/api/conversations/${conversationId}/messages`, { content: input }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInput('');
      // Recharge les messages
      const res = await axios.get(`/api/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
    } catch (e) {
      // Erreur d'envoi
    }
    setLoading(false);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 16, maxWidth: 400 }}>
      <h3>Messagerie (démo)</h3>
      <div style={{ minHeight: 120, marginBottom: 8, background: '#f9f9f9', padding: 8 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: 4 }}>
            <b>{msg.sender_id === window.userId ? 'Moi' : 'Autre'} :</b> {msg.content}
          </div>
        ))}
        {messages.length === 0 && <span>Aucun message</span>}
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Votre message..."
          style={{ flex: 1 }}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>Envoyer</button>
      </form>
    </div>
  );
};

export default ChatDemo;
