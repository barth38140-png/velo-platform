import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock react-leaflet to avoid map rendering in tests
vi.mock('react-leaflet', async () => {
  const actual = await vi.importActual('react-leaflet');
  return {
    ...actual,
    MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
    TileLayer: () => <div data-testid="tilelayer" />,
    Marker: ({ children }) => <div data-testid="marker">{children}</div>,
    useMapEvents: () => null,
    useMap: () => ({
      setView: vi.fn(),
      getCenter: () => ({ lat: 0, lng: 0 })
    })
  };
});

import MapPicker from '../MapPicker';

describe('MapPicker', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url) => {
      if (url.includes('reverse')) {
        return {
          ok: true,
          json: async () => ({ display_name: 'Paris, France' })
        };
      }
      if (url.includes('search')) {
        return {
          ok: true,
          json: async () => ([]) 
        };
      }
      return { ok: false };
    });
  });

  it('calls onChange with address on initial reverse geocode and when confirming', async () => {
    const onChange = vi.fn();
    render(<MapPicker onChange={onChange} initialPosition={{ lat: 48.8566, lng: 2.3522 }} />);

    // Wait for address to be fetched and displayed
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(await screen.findByText(/Paris, France/i)).toBeInTheDocument();

    // Click confirm button
    const confirm = screen.getByRole('button', { name: /Confirmer la position/i });
    fireEvent.click(confirm);

    expect(onChange).toHaveBeenCalled();
    const calledArg = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(calledArg).toHaveProperty('lat');
    expect(calledArg).toHaveProperty('lng');
    expect(calledArg).toHaveProperty('address');
  });
});
