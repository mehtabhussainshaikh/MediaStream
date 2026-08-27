import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

it('moves to the next available server page', async () => { const onPage = vi.fn(); render(<Pagination meta={{ page: 1, totalPages: 3, hasPreviousPage: false, hasNextPage: true }} onPage={onPage} />); await userEvent.click(screen.getByRole('button', { name: 'Next' })); expect(onPage).toHaveBeenCalledWith(2); expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled(); });
