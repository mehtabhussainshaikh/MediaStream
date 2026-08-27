import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { MediaRenderer } from './MediaRenderer';

it('renders an accessible image and fallback after failure', () => { render(<MediaRenderer mediaType="image" src="bad.jpg" title="Portrait" />); const image = screen.getByRole('img', { name: 'Portrait' }); fireEvent.error(image); expect(screen.getByRole('img', { name: 'Portrait preview unavailable' })).toBeInTheDocument(); expect(screen.getByRole('link', { name: 'Open original' })).toHaveAttribute('href', 'bad.jpg'); });
