import React from 'react';

// Interactive bike SVG component. Each major part is a <g> with a data-part attribute
// and exposes click/keyboard events via props.
export default function BikeSVG({ selectedPart, onPartClick, frameColors }) {
  const normalizeHex = (hex) => (typeof hex === 'string' ? hex.trim() : '').replace(/;|"|'/g, '');
  const fallback = '#3b82f6';
  const colors = Array.isArray(frameColors) && frameColors.length
    ? frameColors.map(normalizeHex).filter(Boolean)
    : [fallback];
  const shade = (hex, factor = -0.2) => {
    try {
      const h = hex.replace('#','');
      const bigint = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      const adj = (v) => Math.max(0, Math.min(255, Math.round(v + v*factor)));
      const rr = adj(r).toString(16).padStart(2,'0');
      const gg = adj(g).toString(16).padStart(2,'0');
      const bb = adj(b).toString(16).padStart(2,'0');
      return `#${rr}${gg}${bb}`;
    } catch { return hex; }
  };
  const multiStops = (arr) => {
    if (!arr || arr.length === 0) return [
      { offset: '0%', color: fallback },
      { offset: '100%', color: shade(fallback, -0.35) }
    ];
    if (arr.length === 1) return [
      { offset: '0%', color: arr[0] },
      { offset: '100%', color: shade(arr[0], -0.35) }
    ];
    const n = arr.length;
    return arr.map((c, i) => ({ offset: `${Math.round((i/(n-1))*100)}%`, color: c }));
  };
  const stops = multiStops(colors);
  const handleKey = (e, part) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPartClick(part);
    }
  };

  return (
    <svg className="bike-svg" viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration interactive de vélo">
      <defs>
        {/* Default gradient kept for legacy accents */}
        <linearGradient id="bikeGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        {/* Dynamic frame gradient based on selected color */}
        <linearGradient id="frameGrad" x1="0" x2="1">
          {stops.map(s => (<stop key={s.offset} offset={s.offset} stopColor={s.color} />))}
        </linearGradient>
      </defs>

      {/* Background subtle shadow */}
      <rect x="0" y="0" width="100%" height="100%" fill="transparent" />

      {/* Left wheel */}
      <g
        className={`hotspot wheel ${selectedPart === 'wheels' ? 'hot-active' : ''}`}
        tabIndex={0}
        role="button"
        aria-pressed={selectedPart === 'wheels'}
        onClick={() => onPartClick('wheels')}
        onKeyDown={(e) => handleKey(e, 'wheels')}
        data-part="wheels"
      >
        <circle cx="140" cy="260" r="76" stroke="url(#frameGrad)" strokeWidth="6" fill="none" />
        <circle cx="140" cy="260" r="8" fill="#0f172a" />
      </g>

      {/* Right wheel */}
      <g
        className={`hotspot wheel ${selectedPart === 'wheels' ? 'hot-active' : ''}`}
        tabIndex={0}
        role="button"
        aria-pressed={selectedPart === 'wheels'}
        onClick={() => onPartClick('wheels')}
        onKeyDown={(e) => handleKey(e, 'wheels')}
        data-part="wheels"
      >
        <circle cx="460" cy="260" r="76" stroke="url(#frameGrad)" strokeWidth="6" fill="none" />
        <circle cx="460" cy="260" r="8" fill="#0f172a" />
      </g>

      {/* Frame */}
      <g
        className={`hotspot frame ${selectedPart === 'frame' ? 'hot-active' : ''}`}
        tabIndex={0}
        role="button"
        aria-pressed={selectedPart === 'frame'}
        onClick={() => onPartClick('frame')}
        onKeyDown={(e) => handleKey(e, 'frame')}
        data-part="frame"
      >
        <path d="M170 250 L240 170 L320 170 L400 250" stroke="url(#frameGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M240 170 L300 235" stroke="url(#frameGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M320 170 L280 235" stroke="url(#frameGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
      </g>

      {/* Handlebar */}
      <g
        className={`hotspot handlebar ${selectedPart === 'handlebar' ? 'hot-active' : ''}`}
        tabIndex={0}
        role="button"
        aria-pressed={selectedPart === 'handlebar'}
        onClick={() => onPartClick('handlebar')}
        onKeyDown={(e) => handleKey(e, 'handlebar')}
        data-part="handlebar"
      >
        <path d="M340 130 L380 120" stroke="url(#frameGrad)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M380 120 L410 130" stroke="url(#frameGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>

      {/* Saddle */}
      <g
        className={`hotspot saddle ${selectedPart === 'saddle' ? 'hot-active' : ''}`}
        tabIndex={0}
        role="button"
        aria-pressed={selectedPart === 'saddle'}
        onClick={() => onPartClick('saddle')}
        onKeyDown={(e) => handleKey(e, 'saddle')}
        data-part="saddle"
      >
        <ellipse cx="295" cy="140" rx="28" ry="10" fill="#0f172a" />
      </g>

      {/* Pedals */}
      <g
        className={`hotspot pedals ${selectedPart === 'pedals' ? 'hot-active' : ''}`}
        tabIndex={0}
        role="button"
        aria-pressed={selectedPart === 'pedals'}
        onClick={() => onPartClick('pedals')}
        onKeyDown={(e) => handleKey(e, 'pedals')}
        data-part="pedals"
      >
        <rect x="280" y="235" width="40" height="6" rx="3" fill="#0f172a" />
        <rect x="310" y="245" width="6" height="20" rx="2" fill="#0f172a" transform="rotate(0 310 245)" />
      </g>

      {/* Transmission (chain/derailleur area) */}
      <g
        className={`hotspot transmission ${selectedPart === 'transmission' ? 'hot-active' : ''}`}
        tabIndex={0}
        role="button"
        aria-pressed={selectedPart === 'transmission'}
        onClick={() => onPartClick('transmission')}
        onKeyDown={(e) => handleKey(e, 'transmission')}
        data-part="transmission"
      >
        <circle cx="240" cy="235" r="12" fill="#0f172a" />
        <path d="M252 235 L300 235" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Brakes (disc area visual) */}
      <g
        className={`hotspot brakes ${selectedPart === 'brakes' ? 'hot-active' : ''}`}
        tabIndex={0}
        role="button"
        aria-pressed={selectedPart === 'brakes'}
        onClick={() => onPartClick('brakes')}
        onKeyDown={(e) => handleKey(e, 'brakes')}
        data-part="brakes"
      >
        <circle cx="140" cy="260" r="8" fill="#cbd5e1" />
        <circle cx="460" cy="260" r="8" fill="#cbd5e1" />
      </g>

    </svg>
  );
}
