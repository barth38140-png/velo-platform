import React from 'react';

export default function SummaryCard({ config }) {
  if (!config) return null;
  const { brand, model, type, frame_size, wheel_size, colors = [], confidence_score, unknown_attributes } = config;
  const confidenceDisplay = typeof confidence_score === 'number' ? `${Math.round(confidence_score * 100)}%` : null;
  const unknownCount = Array.isArray(unknown_attributes) ? unknown_attributes.length : 0;
  return (
    <div className="summary-card compact">
      {/* Bloc marque, modèle, taille et couleurs retiré */}
      {confidenceDisplay && <div className="summary-row">Fiabilité: {confidenceDisplay}</div>}
      {unknownCount > 0 && <div className="summary-row">Attributs inconnus: {unknownCount}</div>}
    </div>
  );
}
