import { describe, it, expect } from 'vitest';
import { updatePhysics, calculateSpeed, limitPosition } from './physics';

describe('physics utils', () => {
    describe('updatePhysics', () => {
        it('should apply acceleration when keys are pressed', () => {
            const physics = { velocity: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 } };
            const keys = { ArrowRight: true, ArrowLeft: false, ArrowUp: false, ArrowDown: false };
            
            const result = updatePhysics(physics, keys);
            expect(result.velocity.x).toBeGreaterThan(0);
            expect(result.velocity.y).toBe(0);
        });

        it('should apply diagonal modifier when moving diagonally', () => {
            const physics = { velocity: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 } };
            const keys = { ArrowRight: true, ArrowDown: true, ArrowLeft: false, ArrowUp: false };
            
            const result = updatePhysics(physics, keys);
            expect(result.acceleration.x).toBeLessThan(0.3); // Should be modified by DIAGONAL_MODIFIER
            expect(result.acceleration.y).toBeLessThan(0.3);
        });
    });

    describe('calculateSpeed', () => {
        it('should calculate correct speed', () => {
            expect(calculateSpeed({ x: 3, y: 4 })).toBe(5);
            expect(calculateSpeed({ x: 0, y: 5 })).toBe(5);
            expect(calculateSpeed({ x: 0, y: 0 })).toBe(0);
        });
    });

    describe('limitPosition', () => {
        it('should limit position within bounds', () => {
            expect(limitPosition(100, 100, 800, 600)).toEqual({ x: 100, y: 100 });
            expect(limitPosition(-10, 50, 800, 600)).toEqual({ x: 0, y: 50 });
            expect(limitPosition(850, 650, 800, 600)).toEqual({ x: 800, y: 600 });
        });
    });
});
