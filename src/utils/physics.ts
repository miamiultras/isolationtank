import type { Physics } from './entities';

export const PHYSICS_CONFIG = {
    ACCELERATION: 0.3,
    MAX_SPEED: 8,
    FRICTION: 0.95,
    DIAGONAL_MODIFIER: 0.707,
    BUBBLE_SPEED_THRESHOLD: 0.08,     // Lower threshold for earlier bubble spawning
    BUBBLE_SPAWN_CHANCE: 0.7,         // Higher chance to spawn bubbles
    BUBBLE_VELOCITY_MODIFIER: -0.3,    // Keep the same velocity
    BUBBLE_RANDOM_FACTOR: 0.8         // Keep the same randomness
};

export function updatePhysics(physics: Physics, keys: Record<string, boolean>): Physics {
    const acceleration = {
        x: (keys.ArrowRight ? PHYSICS_CONFIG.ACCELERATION : 0) - (keys.ArrowLeft ? PHYSICS_CONFIG.ACCELERATION : 0),
        y: (keys.ArrowDown ? PHYSICS_CONFIG.ACCELERATION : 0) - (keys.ArrowUp ? PHYSICS_CONFIG.ACCELERATION : 0)
    };

    if (acceleration.x !== 0 && acceleration.y !== 0) {
        acceleration.x *= PHYSICS_CONFIG.DIAGONAL_MODIFIER;
        acceleration.y *= PHYSICS_CONFIG.DIAGONAL_MODIFIER;
    }

    const velocity = {
        x: (physics.velocity.x + acceleration.x) * PHYSICS_CONFIG.FRICTION,
        y: (physics.velocity.y + acceleration.y) * PHYSICS_CONFIG.FRICTION
    };

    const speed = calculateSpeed(velocity);
    if (speed > PHYSICS_CONFIG.MAX_SPEED) {
        velocity.x = (velocity.x / speed) * PHYSICS_CONFIG.MAX_SPEED;
        velocity.y = (velocity.y / speed) * PHYSICS_CONFIG.MAX_SPEED;
    }

    return { velocity, acceleration };
}

export function limitPosition(x: number, y: number, maxWidth: number, maxHeight: number) {
    return {
        x: Math.max(0, Math.min(maxWidth, x)),
        y: Math.max(0, Math.min(maxHeight, y))
    };
}

export function calculateSpeed(velocity: { x: number, y: number }): number {
    return Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
}

export function shouldSpawnBubble(velocity: { x: number, y: number }): boolean {
    const speed = calculateSpeed(velocity);
    return speed > PHYSICS_CONFIG.BUBBLE_SPEED_THRESHOLD && 
           Math.random() < (speed / PHYSICS_CONFIG.MAX_SPEED) * PHYSICS_CONFIG.BUBBLE_SPAWN_CHANCE;
}

export function calculateBubbleVelocity(velocity: { x: number, y: number }): { x: number, y: number } {
    return {
        x: velocity.x * PHYSICS_CONFIG.BUBBLE_VELOCITY_MODIFIER + (Math.random() - 0.5) * PHYSICS_CONFIG.BUBBLE_RANDOM_FACTOR,
        y: velocity.y * PHYSICS_CONFIG.BUBBLE_VELOCITY_MODIFIER + (Math.random() - 0.5) * PHYSICS_CONFIG.BUBBLE_RANDOM_FACTOR
    };
}
