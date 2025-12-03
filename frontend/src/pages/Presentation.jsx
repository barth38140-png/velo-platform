import './Presentation.css';

export function Presentation() {
  return (
    <div className="presentation-root">
      <header className="presentation-hero">
        <h1>Velo Platform</h1>
        <p className="subtitle">La plateforme de gestion et de réservation de réparations vélo</p>
        <a className="cta" href="/register">Commencer</a>
      </header>

      <section className="features">
        <article>
          <h2>Réparateurs locaux</h2>
          <p>Trouvez des réparateurs proches et réservez en quelques clics.</p>
        </article>
        <article>
          <h2>Gestion des demandes</h2>
          <p>Suivez l'avancement des réparations et communiquez avec le réparateur.</p>
        </article>
        <article>
          <h2>Photos & preuves</h2>
          <p>Ajoutez des photos pour décrire le problème et vérifier la réparation.</p>
        </article>
      </section>

      <footer className="presentation-footer">
        <p>© {new Date().getFullYear()} Velo Platform</p>
      </footer>
    </div>
  );
}

export default Presentation;
