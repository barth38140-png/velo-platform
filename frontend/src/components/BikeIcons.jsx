import React from 'react';
import { Icon } from '@iconify/react';

// Composant d'icônes de vélos basé sur Iconify (pack MDI)
// Types supportés: road, mountain, city, electric, cargo
// Personnalisation: size, labels (bool), className, style, onSelect
const TYPE_ICON_MAP = {
  road: 'mdi:bike', // vélo générique
  mountain: 'mdi:bicycle-electric', // approximation VTT (peut être remplacé par autre)
  city: 'mdi:bicycle-basket',
  electric: 'mdi:bike-fast',
  cargo: 'mdi:cargo-bike'
};

const DEFAULT_LABELS = {
  road: 'Vélo de route',
  mountain: 'VTT',
  city: 'Vélo de ville',
  electric: 'Vélo électrique',
  cargo: 'Cargo bike'
};

export default function BikeIcons({
  types = ['road', 'mountain', 'city'],
  size = 64,
  labels = true,
  className = '',
  style = {},
  onSelect
}) {
  return (
    <div className={`bike-icons-grid ${className}`} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', ...style }}>
      {types.map((t) => {
        const iconName = TYPE_ICON_MAP[t];
        if (!iconName) return null;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onSelect && onSelect(t)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: onSelect ? 'pointer' : 'default',
              textAlign: 'center',
              padding: '0.5rem'
            }}
            aria-label={DEFAULT_LABELS[t] || t}
          >
            <Icon icon={iconName} width={size} height={size} />
            {labels && (
              <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', fontWeight: 500 }}>
                {DEFAULT_LABELS[t] || t}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Exemple d'usage:
// <BikeIcons onSelect={(type) => console.log('Choisi:', type)} />
// <BikeIcons types={['road','city']} size={48} labels={false} />
