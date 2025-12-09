import React, { useState, useEffect, useRef } from 'react';
import { conversationService } from '../services/api';
import { socket } from '../services/socket';

/**
 * Composant de chat temps réel avec Socket.io
 */
const ChatDemoSocket = ({ conversationId, token, userId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    // Récupère les messages existants
    const fetchMessages = async () => {
      try {
        const res = await conversationService.getMessages(conversationId);
        setMessages(res.data?.messages || []);
        setError('');
      } catch (e) {
        if (e?.response?.status === 429) {
          setError('Trop de requêtes, veuillez patienter avant de recharger la conversation.');
        } else {
          setError('Erreur lors du chargement des messages.');
        }
        setMessages([]);
      }
    };
    // Appel unique à l'ouverture de la conversation
    fetchMessages();
  }, [conversationId, token]);

  useEffect(() => {
    // Utiliser le socket centralisé au lieu de créer une nouvelle instance
    if (!socket) return;
    
    // Connecter si pas déjà connecté
    if (!socket.connected) {
      socket.connect();
    }

    // Éviter les joins multiples
    if (!hasJoinedRef.current) {
      socket.emit('join_conversation', { conversationId, userId });
      hasJoinedRef.current = true;
    }

    const onNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('new_message', onNewMessage);

    return () => {
      socket.off('new_message', onNewMessage);
      hasJoinedRef.current = false;
      // Ne pas déconnecter le socket car d'autres composants peuvent l'utiliser
    };
  }, [conversationId, token, userId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    setLoading(true);
    // Envoi via Socket.io
    socket.emit('send_message', { conversationId, senderId: userId, content: input });
    setInput('');
    setLoading(false);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 16, maxWidth: 400 }}>
      <h3>Messagerie temps réel (Socket.io)</h3>
      {error && <div style={{color:'#c33',background:'#fee',padding:8,borderRadius:6,marginBottom:8}}>{error}</div>}
      <div style={{ minHeight: 120, marginBottom: 8, background: '#f9f9f9', padding: 8 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: 4 }}>
            <b>{msg.sender_id === userId ? 'Moi' : 'Autre'} :</b> {msg.content}
          </div>
        ))}
        {messages.length === 0 && !error && <span>Aucun message</span>}
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

export default ChatDemoSocket;
