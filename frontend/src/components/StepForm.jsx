import React from 'react';
import '../styles/RepairForm.css';

export default function StepForm({ steps = [], current = 0, children, className = '' }) {
  // children is expected to be an array of panels or a function that receives controls
  const total = steps.length || (Array.isArray(children) ? children.length : 0);

  return (
    <div className={`step-form ${className}`}>
      <div className="steps-indicator" role="tablist" aria-label="Progress">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <button type="button" className={`step ${i === current ? 'active' : ''}`} aria-current={i === current}>{s}</button>
            {i < steps.length - 1 && <div className="step-sep" aria-hidden />}
          </React.Fragment>
        ))}
      </div>

      <div className="step-panel">
        {typeof children === 'function' ? children({ current, total }) : (Array.isArray(children) ? children[current] : children)}
      </div>
    </div>
  );
}
