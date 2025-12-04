import React from 'react';

// Composants optimisés avec React.memo
import BikeCard from './BikeCard';
import ComponentItem from './ComponentItem';
import SummaryCard from './SummaryCard';
import ColorSwatch from './ColorSwatch';

const MemoizedBikeCard = React.memo(BikeCard, (prevProps, nextProps) => {
  return prevProps.bike?.id === nextProps.bike?.id &&
         prevProps.bike?.updated_at === nextProps.bike?.updated_at;
});

const MemoizedComponentItem = React.memo(ComponentItem, (prevProps, nextProps) => {
  return prevProps.component?.id === nextProps.component?.id &&
         prevProps.component?.updated_at === nextProps.component?.updated_at;
});

const MemoizedSummaryCard = React.memo(SummaryCard, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config);
});

const MemoizedColorSwatch = React.memo(ColorSwatch, (prevProps, nextProps) => {
  return prevProps.color === nextProps.color &&
         prevProps.selected === nextProps.selected;
});

// Export des composants optimisés
export { MemoizedBikeCard, MemoizedComponentItem, MemoizedSummaryCard, MemoizedColorSwatch };
