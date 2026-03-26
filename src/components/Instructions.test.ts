import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Instructions from './Instructions.svelte';

describe('Instructions Component', () => {
    it('renders the how to play heading', () => {
        render(Instructions);
        expect(screen.getByRole('heading', { name: /how to play/i })).toBeInTheDocument();
    });

    it('displays all control keys including arrows and spacebar', () => {
        render(Instructions);
        expect(screen.getByText('↑')).toBeInTheDocument();
        expect(screen.getByText('←')).toBeInTheDocument();
        expect(screen.getByText('↓')).toBeInTheDocument();
        expect(screen.getByText('→')).toBeInTheDocument();
        expect(screen.getByText('SPACE')).toBeInTheDocument();
    });

    it('shows control labels for both movement and boost', () => {
        render(Instructions);
        expect(screen.getByText('move')).toBeInTheDocument();
        expect(screen.getByText('boost (costs energy & size)')).toBeInTheDocument();
    });

    it('displays all game instruction points including boost mechanics', () => {
        render(Instructions);
        expect(screen.getByText(/absorb/i)).toBeInTheDocument();
        expect(screen.getByText(/avoid/i)).toBeInTheDocument();
        expect(screen.getByText(/grow/i)).toBeInTheDocument();
        expect(screen.getAllByText(/boost/i)).toHaveLength(2); // One in control label, one in instructions
        expect(screen.getByText(/eat/i)).toBeInTheDocument();
        expect(screen.getByText('smaller entities')).toBeInTheDocument();
        expect(screen.getByText('larger entities')).toBeInTheDocument();
        expect(screen.getByText('and survive')).toBeInTheDocument();
        expect(screen.getByText('for speed, but lose size & energy')).toBeInTheDocument();
        expect(screen.getByText('balls to regenerate energy')).toBeInTheDocument();
    });

    it('renders important action words including boost mechanics', () => {
        render(Instructions);
        expect(screen.getByText('Absorb')).toBeInTheDocument();
        expect(screen.getByText('Avoid')).toBeInTheDocument();
        expect(screen.getByText('Grow')).toBeInTheDocument();
        expect(screen.getByText('Boost')).toBeInTheDocument();
        expect(screen.getByText('Eat')).toBeInTheDocument();
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