import React from 'react';

/**
 * Composant ErrorBoundary pour capturer les erreurs React et afficher un message utilisateur.
 * Utilisation : englober AppRoutes ou tout composant critique.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log technique (uniquement en dev)
    // Utiliser le logger Pino côté backend pour les erreurs critiques
    // Ici, on ne log rien côté frontend pour respecter la convention
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center', color: '#c00' }}>
          <h2>Une erreur inattendue est survenue 😢</h2>
          <p>Essayez de recharger la page ou contactez le support si le problème persiste.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
