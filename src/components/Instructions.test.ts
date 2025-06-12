import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Instructions from './Instructions.svelte';

describe('Instructions Component', () => {
    it('renders the how to play heading', () => {
        render(Instructions);
        expect(screen.getByRole('heading', { name: /how to play/i })).toBeInTheDocument();
    });

    it('displays all arrow keys in the controls section', () => {
        render(Instructions);
        expect(screen.getByText('↑')).toBeInTheDocument();
        expect(screen.getByText('←')).toBeInTheDocument();
        expect(screen.getByText('↓')).toBeInTheDocument();
        expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('shows the move label for controls', () => {
        render(Instructions);
        expect(screen.getByText('move')).toBeInTheDocument();
    });

    it('displays all game instruction points', () => {
        render(Instructions);
        expect(screen.getByText(/absorb/i)).toBeInTheDocument();
        expect(screen.getByText(/avoid/i)).toBeInTheDocument();
        expect(screen.getByText(/grow/i)).toBeInTheDocument();
        expect(screen.getByText('smaller entities')).toBeInTheDocument();
        expect(screen.getByText('larger entities')).toBeInTheDocument();
        expect(screen.getByText('and survive')).toBeInTheDocument();
    });

    it('renders important action words', () => {
        render(Instructions);
        expect(screen.getByText('Absorb')).toBeInTheDocument();
        expect(screen.getByText('Avoid')).toBeInTheDocument();
        expect(screen.getByText('Grow')).toBeInTheDocument();
    });

    it('renders with showInGame prop variations', () => {
        // Test default behavior
        const { unmount } = render(Instructions, { showInGame: false });
        expect(screen.getByRole('heading', { name: /how to play/i })).toBeInTheDocument();
        unmount();

        // Test in-game behavior
        render(Instructions, { showInGame: true });
        expect(screen.getByRole('heading', { name: /how to play/i })).toBeInTheDocument();
    });
}); 