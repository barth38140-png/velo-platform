import React from 'react';

export default function ComponentItem({ component }) {
  const wear = component.wear || 0;
  const color = wear > 80 ? '#d9534f' : wear > 50 ? '#f0ad4e' : '#5cb85c';
  return (
    <div className="component-item">
      <div className="component-name">{component.name}</div>
      <div className="component-wear">
        <div className="wear-bar" style={{ background: '#eee' }}>
          <div className="wear-level" style={{ width: `${wear}%`, background: color }} />
        </div>
        <div className="wear-percent">{wear}%</div>
      </div>
    </div>
  );
}
