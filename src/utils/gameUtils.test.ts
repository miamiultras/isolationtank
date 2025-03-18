import { describe, it, expect } from 'vitest';
import { checkCollision, calculateGrowth, createBubble } from './gameUtils';

describe('game utils', () => {
    describe('checkCollision', () => {
        it('should detect collision between two circles', () => {
            expect(checkCollision(0, 0, 10, 5, 5, 10)).toBe(true);
            expect(checkCollision(0, 0, 5, 20, 20, 5)).toBe(false);
        });
    });

    describe('calculateGrowth', () => {
        it('should increase size proportionally', () => {
            expect(calculateGrowth(10, 4)).toBe(12);
            expect(calculateGrowth(20, 10)).toBe(25);
        });
    });

    describe('createBubble', () => {
        it('should create bubble with valid properties', () => {
            const bubble = createBubble(100, 100, { x: 1, y: 1 }, 1);
            
            expect(bubble).toHaveProperty('id', 1);
            expect(bubble).toHaveProperty('x');
            expect(bubble).toHaveProperty('y');
            expect(bubble.size).toBeGreaterThan(0);
            expect(bubble.opacity).toBe(0.7);
            expect(bubble.velocity).toHaveProperty('x');
            expect(bubble.velocity).toHaveProperty('y');
        });
    });
});
