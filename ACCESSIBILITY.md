# Guide d'accessibilité - Velo Platform

## Principes d'accessibilité implémentés

### Navigation au clavier
- ✅ Tous les éléments interactifs sont accessibles via Tab/Shift+Tab
- ✅ Focus visible sur tous les éléments interactifs
- ✅ Ordre de navigation logique (haut → bas, gauche → droite)
- ✅ Raccourcis clavier : Esc pour fermer les modales, Enter pour valider

### ARIA et sémantique
- ✅ Landmarks ARIA (`role="navigation"`, `role="main"`, `role="complementary"`)
- ✅ Labels ARIA sur tous les boutons d'icônes
- ✅ `aria-live` pour les notifications et messages d'état
- ✅ `aria-expanded`, `aria-selected` sur les éléments interactifs
- ✅ `aria-label` ou `aria-labelledby` sur les contrôles sans label visible

### Contraste et visibilité
- ✅ Ratios de contraste conformes WCAG 2.1 niveau AA
- ✅ Focus visible avec outline de 2px minimum
- ✅ Taille de police minimale de 14px (corps de texte)
- ✅ Cibles tactiles d'au moins 44x44px

### Formulaires
- ✅ Labels associés via `htmlFor`/`id`
- ✅ Messages d'erreur descriptifs liés aux champs
- ✅ Instructions et aides contextuelles
- ✅ Validation en temps réel avec feedback accessible

### Lecteurs d'écran
- ✅ Structure sémantique HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`)
- ✅ Textes alternatifs sur les images significatives
- ✅ `aria-hidden="true"` sur les icônes décoratives
- ✅ Annonces vocales pour les changements dynamiques

## Composants accessibles

### BikeCard
```jsx
<button 
  className="btn" 
  onClick={onView}
  aria-label={`Voir les détails du vélo ${bike.name}`}
>
  Voir
</button>
```

### ColorSwatch
```jsx
<button 
  className="color-swatch-btn"
  aria-label={`Sélectionner la couleur ${title}`}
  aria-pressed={selected}
  role="switch"
>
  {/* Contenu visuel */}
</button>
```

### RepairForm
```jsx
<form aria-label="Formulaire de demande de réparation">
  <fieldset>
    <legend>Informations du vélo</legend>
    {/* Champs */}
  </fieldset>
</form>
```

## Tests d'accessibilité

### Outils recommandés
- **axe DevTools** (extension Chrome/Firefox)
- **WAVE** (Web Accessibility Evaluation Tool)
- **Lighthouse** (audit intégré Chrome DevTools)
- **NVDA** ou **JAWS** (lecteurs d'écran Windows)
- **VoiceOver** (lecteur d'écran macOS/iOS)

### Checklist de test

#### Navigation clavier
- [ ] Parcourir tout le site avec Tab uniquement
- [ ] Vérifier que le focus est toujours visible
- [ ] Tester Esc sur les modales et popups
- [ ] Vérifier que les listes déroulantes fonctionnent avec les flèches

#### Lecteur d'écran
- [ ] Activer NVDA/VoiceOver
- [ ] Naviguer par landmarks (main, nav, etc.)
- [ ] Vérifier les annonces des changements dynamiques
- [ ] Tester la complétion de formulaires

#### Contraste
- [ ] Vérifier tous les états (normal, hover, focus, disabled)
- [ ] Tester avec le mode sombre si activé
- [ ] Utiliser l'outil de vérification de contraste (ratio 4.5:1 minimum)

#### Zoom
- [ ] Zoomer à 200% et vérifier la lisibilité
- [ ] Vérifier qu'il n'y a pas de scroll horizontal
- [ ] Tester les breakpoints responsive

## Améliorations futures

### Court terme
- Ajouter un mode saut au contenu principal (skip link)
- Implémenter des tooltips accessibles (role="tooltip")
- Améliorer les messages d'erreur de formulaire

### Moyen terme
- Mode sombre avec préservation du contraste
- Préférences utilisateur (taille de police, animations réduites)
- Documentation utilisateur accessible (FALC)

### Long terme
- Support multilingue avec i18n
- Personnalisation avancée de l'interface
- Certification RGAA/WCAG 2.1 niveau AA

## Ressources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/fr/docs/Web/Accessibility)
- [RGAA (France)](https://accessibilite.numerique.gouv.fr/)
