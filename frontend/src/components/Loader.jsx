import React from 'react';
import '../styles/Loader.css';

/**
 * Loader visuel animé pour les chargements longs
 */
const Loader = ({ message = 'Chargement en cours...' }) => (
  <div className="loader-container">
    <div className="loader-spinner" />
    <span className="loader-message">{message}</span>
  </div>
);

export default Loader;
