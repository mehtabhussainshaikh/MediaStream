import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

it('renders an accessible action', () => {
  render(<MemoryRouter><EmptyState title="Nothing here" actionHref="/media" actionLabel="Browse media" /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Browse media' })).toHaveAttribute('href', '/media');
});
