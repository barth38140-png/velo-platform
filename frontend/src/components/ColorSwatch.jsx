import React from 'react';

export default function ColorSwatch({ color, size = 18, selected = false, onClick, title }) {
  // Visual dot is `size`, outer button provides larger hit area when needed.
  const outerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: Math.max(32, size + 12),
    height: Math.max(32, size + 12),
    borderRadius: 9999,
    padding: 4,
    background: '#fff',
    border: selected ? '2px solid var(--primary)' : '1px solid #ccc',
    boxShadow: selected ? '0 6px 14px rgba(46,124,255,0.10)' : 'none',
    cursor: 'pointer',
    transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease'
  };

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: 9999,
    background: color,
    display: 'block'
  };

  return (
    <button type="button" className={`color-swatch-btn ${selected ? 'selected' : ''}`} aria-pressed={selected} aria-label={title} title={title} onClick={onClick} style={outerStyle}>
      <span style={dotStyle} />
      {selected && (
        <span className="color-swatch-check" aria-hidden style={{position:'absolute', right:2, bottom:2, width:14, height:14, borderRadius:9999, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M1 4L4 6.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}
