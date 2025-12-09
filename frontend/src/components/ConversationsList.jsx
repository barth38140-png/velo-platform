import React, { useState, useEffect, useRef } from 'react';
import { conversationService } from '../services/api';
import ChatDemoSocket from './ChatDemoSocket';

/**
 * Liste des conversations + chat temps réel
 */
const ConversationsList = ({ token, userId, initialConversationId }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(initialConversationId || null);
  const [loading, setLoading] = useState(false);

  // LOG: Affiche les props à chaque rendu
  console.debug('[ConversationsList] RENDER', {
    initialConversationId,
    selectedConv,
    conversations,
  });
  // Affiche les logs stockés dans localStorage (debug redirection)
  useEffect(() => {
    const params = window.localStorage.getItem('debug_createConversation_params');
    const resp = window.localStorage.getItem('debug_createConversation_response');
    if (params) {
      console.info('[DEBUG] Params envoyés à createConversation (avant redirection):', JSON.parse(params));
      window.localStorage.removeItem('debug_createConversation_params');
    }
    if (resp) {
      try {
        console.info('[DEBUG] Réponse brute createConversation (avant redirection):', JSON.parse(resp));
      } catch {
        console.info('[DEBUG] Réponse brute createConversation (avant redirection):', resp);
      }
      window.localStorage.removeItem('debug_createConversation_response');
    }
  }, []);

  // Polling pour garantir l'apparition de la conversation initiale
  const pollingRef = useRef({ count: 0, timer: null });

  useEffect(() => {
    let cancelled = false;
    async function fetchAndSelect() {
      try {
        const res = await conversationService.getConversations();
        const data = res.data?.conversations || [];
        setConversations(data);
        // LOG: Affiche la liste récupérée et l'ID recherché
        console.debug('[ConversationsList] fetchAndSelect', {
          initialConversationId,
          data,
        });
        if (initialConversationId) {
          const exists = data.find(c => String(c.id) === String(initialConversationId));
          if (exists) {
            console.debug('[ConversationsList] Conversation trouvée, sélection', exists.id);
            setSelectedConv(exists.id);
            return; // trouvé, on arrête le polling
          } else {
            console.debug('[ConversationsList] Conversation NON trouvée', initialConversationId);
          }
        }
        // Si pas trouvé et polling non annulé, on relance (max 10 fois)
        if (!cancelled && initialConversationId && pollingRef.current.count < 10) {
          pollingRef.current.count++;
          pollingRef.current.timer = setTimeout(fetchAndSelect, 500);
        }
      } catch (err) {
        // Utiliser le logger Pino côté backend pour les erreurs de sélection de conversation
        setConversations([]);
      }
    }
    pollingRef.current.count = 0;
    fetchAndSelect();
    return () => {
      cancelled = true;
      if (pollingRef.current.timer) clearTimeout(pollingRef.current.timer);
    };
  }, [initialConversationId]);

  // Effet pour forcer la sélection si initialConversationId change (même si la liste ne change pas)
  useEffect(() => {
    if (initialConversationId) {
      setSelectedConv(initialConversationId);
    }
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
                onClick={() => {
                  console.debug('[ConversationsList] Click sélection', conv.id);
                  setSelectedConv(conv.id);
                }}
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
        {/* LOG: Affiche la conversation sélectionnée */}
        {selectedConv ? (
          <>
            <div style={{fontSize:'0.9em',color:'#888',marginBottom:8}}>
              <b>Conversation sélectionnée :</b> {selectedConv}
            </div>
            <ChatDemoSocket conversationId={selectedConv} token={token} userId={userId} />
          </>
        ) : (
          <div>Sélectionnez une conversation pour discuter.</div>
        )}
      </div>
    </div>
  );
};

export default ConversationsList;
