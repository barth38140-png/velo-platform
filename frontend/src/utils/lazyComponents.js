import React, { lazy, Suspense } from 'react';

// Loading fallback component
const LoadingFallback = ({ message = 'Chargement...' }) => (
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
const LazyBikeModal = lazy(() => import('../components/BikeModal'));
const LazyAddBikePage = lazy(() => import('../components/AddBikePage'));
const LazyRepairForm = lazy(() => import('../components/RepairForm'));
const LazyMapPicker = lazy(() => import('../components/MapPicker'));

// HOC pour wrapper les composants lazy avec Suspense
function withLazyLoading(LazyComponent, fallbackMessage) {
  return function LazyWrapper(props) {
    return (
      <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

export {
  LoadingFallback,
  LazyBikeModal,
  LazyAddBikePage,
  LazyRepairForm,
  LazyMapPicker,
  withLazyLoading
};
