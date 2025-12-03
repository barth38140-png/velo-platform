import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import NotificationCenter from '../NotificationCenter';

describe('NotificationCenter', () => {
  it('renders notifications and calls onDismiss when dismiss clicked', () => {
    const notifications = [
      { id: 1, text: 'Test 1' },
      { id: 2, text: 'Test 2' }
    ];
    const onDismiss = vi.fn();

    render(<NotificationCenter notifications={notifications} onDismiss={onDismiss} />);

    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('Test 2')).toBeInTheDocument();

    const dismissBtns = screen.getAllByText(/Dismiss/i);
    fireEvent.click(dismissBtns[0]);
    expect(onDismiss).toHaveBeenCalledWith(1);
  });
});
