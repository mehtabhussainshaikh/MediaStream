import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { MediaRenderer } from './MediaRenderer';

it('renders an accessible image and fallback after failure', () => { render(<MediaRenderer mediaType="image" src="bad.jpg" title="Portrait" />); const image = screen.getByRole('img', { name: 'Portrait' }); fireEvent.error(image); expect(screen.getByRole('img', { name: 'Portrait preview unavailable' })).toBeInTheDocument(); expect(screen.getByRole('link', { name: 'Open original' })).toHaveAttribute('href', 'bad.jpg'); });

it('renders PDFs in an embedded viewer', () => { render(<MediaRenderer mediaType="pdf" src="document.pdf" title="Document" />); expect(screen.getByTitle('Document PDF preview')).toHaveAttribute('src', expect.stringContaining('document.pdf#page=1')); });

it('renders video with playback controls on the detail view', () => { const { container } = render(<MediaRenderer mediaType="video" src="clip.mp4" title="Clip" />); const video = container.querySelector('video'); expect(video).toHaveAttribute('src', 'clip.mp4'); expect(video).toHaveAttribute('controls'); });

it('renders audio with playback controls', () => { const { container } = render(<MediaRenderer mediaType="audio" src="recording.mp3" title="Recording" />); const audio = container.querySelector('audio'); expect(audio).toHaveAttribute('src', 'recording.mp3'); expect(audio).toHaveAttribute('controls'); });

it('renders compact video previews without controls', () => { const { container } = render(<MediaRenderer mediaType="video" src="clip.webm" title="Compact clip" compact />); const video = container.querySelector('video'); expect(video).toHaveAttribute('src', 'clip.webm'); expect(video).not.toHaveAttribute('controls'); });
