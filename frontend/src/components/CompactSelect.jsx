import React from 'react';

export default function CompactSelect({ value, onChange, options = [], ariaLabel }) {
  return (
    <div className="compact-select" role="listbox" aria-label={ariaLabel}>
      <select className="compact-select-element" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
