import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import GameScreen from './GameScreen.svelte';

// Mock requestAnimationFrame and cancelAnimationFrame for the game loop
global.requestAnimationFrame = vi.fn((cb) => {
    setTimeout(cb, 16);
    return 1;
});
global.cancelAnimationFrame = vi.fn();

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
});

describe('GameScreen Component', () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
    });

    it('renders the game SVG with proper role', () => {
        render(GameScreen);
        const svg = screen.getByRole('application');
        expect(svg).toBeInTheDocument();
    });

    it('initially shows no game over screen', () => {
        render(GameScreen);
        expect(screen.queryByText('Game Over!')).not.toBeInTheDocument();
        expect(screen.queryByText('Play Again')).not.toBeInTheDocument();
    });

    it('renders and mounts successfully', async () => {
        const { unmount } = render(GameScreen);
        // Wait for the next tick to allow async operations to complete
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Test that the component mounts without errors
        expect(screen.getByRole('application')).toBeInTheDocument();
        
        // Clean up
        unmount();
    });

    it('handles keyboard events including boost activation', async () => {
        render(GameScreen);
        
        // Wait for component to fully initialize
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Test arrow keys
        await fireEvent.keyDown(window, { key: 'ArrowRight' });
        await fireEvent.keyDown(window, { key: 'ArrowUp' });
        await fireEvent.keyUp(window, { key: 'ArrowRight' });
        await fireEvent.keyUp(window, { key: 'ArrowUp' });
        
        // Test spacebar boost activation
        await fireEvent.keyDown(window, { key: ' ' });
        await fireEvent.keyUp(window, { key: ' ' });
        
        // The component should handle these without errors
        expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('ignores non-arrow key events', async () => {
        render(GameScreen);
        
        // Test with non-arrow keys
        await fireEvent.keyDown(window, { key: 'Space' });
        await fireEvent.keyDown(window, { key: 'Enter' });
        await fireEvent.keyUp(window, { key: 'Space' });
        
        // Should not cause any errors
        expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('has proper SVG structure for game elements', () => {
        const { container } = render(GameScreen);
        const svg = container.querySelector('svg');
        
        expect(svg).toHaveAttribute('role', 'application');
        expect(svg).toHaveAttribute('viewBox');
    });

    it('handles component unmounting without errors', async () => {
        const { unmount } = render(GameScreen);
        
        // Wait for component to fully mount
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Unmounting should not throw errors
        expect(() => unmount()).not.toThrow();
    });

    it('renders game container element', () => {
        const { container } = render(GameScreen);
        const gameContainer = container.querySelector('.game-container');
        expect(gameContainer).toBeInTheDocument();
    });
}); 