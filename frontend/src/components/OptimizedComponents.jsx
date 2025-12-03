import React, { lazy, Suspense } from 'react';

// Loading fallback component
export const LoadingFallback = ({ message = 'Chargement...' }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    color: '#666'
  }}>
    <div>{message}</div>
  </div>
);

// Lazy load des composants lourds
export const LazyBikeModal = lazy(() => import('./BikeModal'));
export const LazyAddBikePage = lazy(() => import('./AddBikePage'));
export const LazyRepairForm = lazy(() => import('./RepairForm'));
export const LazyMapPicker = lazy(() => import('./MapPicker'));

// HOC pour wrapper les composants lazy avec Suspense
export function withLazyLoading(LazyComponent, fallbackMessage) {
  return function LazyWrapper(props) {
    return (
      <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Composants optimisés avec React.memo
import BikeCard from './BikeCard';
import ComponentItem from './ComponentItem';
import SummaryCard from './SummaryCard';
import ColorSwatch from './ColorSwatch';

export const MemoizedBikeCard = React.memo(BikeCard, (prevProps, nextProps) => {
  return prevProps.bike?.id === nextProps.bike?.id &&
         prevProps.bike?.updated_at === nextProps.bike?.updated_at;
});

export const MemoizedComponentItem = React.memo(ComponentItem, (prevProps, nextProps) => {
  return prevProps.component?.id === nextProps.component?.id &&
         prevProps.component?.updated_at === nextProps.component?.updated_at;
});

export const MemoizedSummaryCard = React.memo(SummaryCard, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config);
});

export const MemoizedColorSwatch = React.memo(ColorSwatch, (prevProps, nextProps) => {
  return prevProps.color === nextProps.color &&
         prevProps.selected === nextProps.selected;
});
