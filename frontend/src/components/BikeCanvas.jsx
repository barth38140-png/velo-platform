import React from 'react';
import BikeSVG from './BikeSVG';

// Wrapper around BikeSVG; can be extended to handle anchors/positions for popovers
export default function BikeCanvas({ selectedPart, onPartClick, frameColors }) {
  return (
    <div className="bike-canvas" aria-hidden={false}>
      <BikeSVG selectedPart={selectedPart} onPartClick={onPartClick} frameColors={frameColors} />
    </div>
  );
}
