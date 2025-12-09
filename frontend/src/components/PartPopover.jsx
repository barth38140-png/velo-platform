import React, { useState } from 'react';
import ColorSwatch from './ColorSwatch';

export default function PartPopover({ part, options = {}, values = {}, onSelect, onAdd, onClose }) {
  const [newText, setNewText] = useState('');

  if (!part) return null;

  // Map part -> primary display options
  const list = (() => {
    switch (part) {
    case 'frame': return options.frame_sizes || [];
    case 'wheels': return options.wheels || [];
    case 'handlebar': return options.handlebar || [];
    case 'saddle': return options.saddle || [];
    case 'pedals': return options.pedals || [];
    case 'transmission': return options.transmission || [];
    case 'brakes': return options.brakes || [];
    default: return [];
    }
  })();
  const wheelSizes = part === 'wheels' ? (options.wheel_sizes || []) : [];

  return (
    <div className="part-popover" role="dialog" aria-label={`Options pour ${part}`}>
      <div className="part-popover-header"><strong>{part}</strong> <button className="btn small" onClick={onClose} aria-label="Fermer">✖</button></div>
      <div className="part-popover-body">
        <div className="options-grid">
          {list.map(opt => (
            <button key={opt} type="button" className={`issue-btn ${JSON.stringify(values).includes(opt) ? 'active' : ''}`} onClick={() => onSelect(part, opt)}>{opt}</button>
          ))}
        </div>

        {part === 'wheels' && wheelSizes.length > 0 && (
          <div className="wheel-sizes-section">
            <div className="section-label">Dimensions</div>
            <div className="options-grid">
              {wheelSizes.map(ws => (
                <button key={ws} type="button" className={`issue-btn ${values.wheel_size === ws ? 'active' : ''}`} onClick={() => onSelect('wheel_sizes', ws)}>{ws}</button>
              ))}
            </div>
          </div>
        )}

        {part === 'frame' && options.frame_colors && (
          <div className="frame-color-list compact">
            {(options.frame_colors || []).map(c => (
              <ColorSwatch key={c} color={ (options.palette||[]).find(p=>p.name===c)?.hex || '#ddd'} title={c} selected={(values.colors||[]).includes(c)} onClick={() => onSelect('frame_colors', c)} />
            ))}
          </div>
        )}

        <div className="add-option compact">
          <input placeholder="➕ Autre option" value={newText} onChange={e => setNewText(e.target.value)} />
          <button className="btn small" type="button" onClick={() => { if (!newText) return; onAdd(part === 'wheels' && /[0-9]/.test(newText) ? 'wheel_sizes' : part, newText); setNewText(''); }}>Ajouter</button>
        </div>
      </div>
    </div>
  );
}
