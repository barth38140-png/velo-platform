import { useState } from 'react';

// Modal simple pour saisir un message initial et démarrer une conversation
export const ContactRepairerModal = ({ repairer, repairs = [], onClose, onSubmit }) => {
  const [message, setMessage] = useState('');
  const [repairId, setRepairId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit?.(message, repairId || null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal>
      <div className="modal">
        <div className="modal-header">
          <h2>Contacter {repairer.name || 'le réparateur'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {!!repairs.length && (
            <label>
              Associer à votre demande
              <select value={repairId} onChange={(e) => setRepairId(e.target.value)}>
                <option value="">Sélectionnez une demande…</option>
                {repairs.map((r) => (
                  <option key={r.id} value={r.id}>
                    #{r.id} · {r.title || r.description || 'Demande'} · {r.status}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Votre message
            <textarea
              placeholder="Décrivez brièvement votre besoin…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose} disabled={submitting}>Annuler</button>
            <button type="submit" className="primary" disabled={submitting || !message.trim() || !repairId}>
              {submitting ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// PropTypes supprimés pour éviter dépendances supplémentaires

export default ContactRepairerModal;
