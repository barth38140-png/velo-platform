import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ColorSwatch from './ColorSwatch';

// Props:
// - open: boolean
// - onClose: () => void
// - palette: [{name,hex}]
// - selected: [names]
// - onToggleColor(name)
// - anchorId (optional) used for aria-controls
export default function ColorPopover({ open, onClose, palette = [], selected = [], onToggleColor, anchorId }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  // compute position relative to anchor and viewport
  const computePosition = () => {
    const anchorEl = anchorId ? document.getElementById(anchorId) : null;
    if (!anchorEl || !ref.current) return;
    const anchorRect = anchorEl.getBoundingClientRect();
    const popRect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // mobile bottom sheet behavior
    if (vw <= 640) {
      setStyle({ position: 'fixed', left: 8, right: 8, bottom: 8, width: vw - 16, transform: 'translateY(0)', zIndex: 1000 });
      return;
    }

    const margin = 8;
    let top = anchorRect.bottom + margin;
    let left = anchorRect.left + (anchorRect.width / 2) - (popRect.width / 2);
    // flip up if doesn't fit below
    if (top + popRect.height > vh - margin) {
      top = anchorRect.top - popRect.height - margin;
    }
    // adjust horizontally
    if (left + popRect.width > vw - margin) left = vw - popRect.width - margin;
    if (left < margin) left = margin;

    setStyle({ position: 'absolute', top: Math.max(margin, Math.round(top)), left: Math.round(left), zIndex: 1000 });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') { onClose && onClose(); } };
    const onDoc = (e) => {
      const anchorEl = anchorId ? document.getElementById(anchorId) : null;
      if (!ref.current) return;
      if (ref.current.contains(e.target) || (anchorEl && anchorEl.contains(e.target))) return;
      onClose && onClose();
    };

    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition, true);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);

    // compute after render
    requestAnimationFrame(() => computePosition());

    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open, anchorId, onClose]);

  if (!open) return null;

  const content = (
    <div className="color-popover" role="dialog" aria-modal="false" aria-label="Sélecteur de couleur" ref={ref} id={anchorId ? `${anchorId}-pop` : undefined} style={style}>
      <div className="color-popover-grid" role="list" aria-label="Couleurs disponibles">
        {palette.map(c => {
          const isSelected = (selected || []).includes(c.name);
          return (
            <div key={c.name} role="listitem">
              <ColorSwatch color={c.hex} size={18} title={c.name} selected={isSelected} onClick={() => onToggleColor && onToggleColor(c.name)} />
            </div>
          );
        })}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
