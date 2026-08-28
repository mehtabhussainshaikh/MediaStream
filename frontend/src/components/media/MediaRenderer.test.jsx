import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { MediaRenderer } from './MediaRenderer';

it('renders an accessible image and fallback after failure', () => { render(<MediaRenderer mediaType="image" src="bad.jpg" title="Portrait" />); const image = screen.getByRole('img', { name: 'Portrait' }); fireEvent.error(image); expect(screen.getByRole('img', { name: 'Portrait preview unavailable' })).toBeInTheDocument(); expect(screen.getByRole('link', { name: 'Open original' })).toHaveAttribute('href', 'bad.jpg'); });

it('renders local PDFs in an embedded viewer', () => { render(<MediaRenderer mediaType="pdf" src="blob:document" title="Document" />); expect(screen.getByTitle('Document PDF preview')).toHaveAttribute('src', expect.stringContaining('blob:document#page=1')); });

it('renders a deliverable first-page preview for Cloudinary PDFs', () => { render(<MediaRenderer mediaType="pdf" src="https://res.cloudinary.com/demo/image/upload/v1/document.pdf" title="Document" />); const preview = screen.getByRole('img', { name: 'First page of Document' }); expect(preview).toHaveAttribute('src', expect.stringContaining('/upload/pg_1,w_1400,c_limit,q_auto,f_jpg/')); expect(preview).toHaveAttribute('src', expect.stringMatching(/document\.jpg$/)); });

it('renders video with playback controls on the detail view', () => { const { container } = render(<MediaRenderer mediaType="video" src="clip.mp4" title="Clip" />); const video = container.querySelector('video'); expect(video).toHaveAttribute('src', 'clip.mp4'); expect(video).toHaveAttribute('controls'); });

it('renders audio with playback controls', () => { const { container } = render(<MediaRenderer mediaType="audio" src="recording.mp3" title="Recording" />); const audio = container.querySelector('audio'); expect(audio).toHaveAttribute('src', 'recording.mp3'); expect(audio).toHaveAttribute('controls'); });

it('renders compact video previews without controls', () => { const { container } = render(<MediaRenderer mediaType="video" src="clip.webm" title="Compact clip" compact />); const video = container.querySelector('video'); expect(video).toHaveAttribute('src', 'clip.webm'); expect(video).not.toHaveAttribute('controls'); });
