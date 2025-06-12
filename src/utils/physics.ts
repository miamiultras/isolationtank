import type { Physics } from './entities';

export const PHYSICS_CONFIG = {
    ACCELERATION: 0.4,                // Increased for snappier response
    MAX_SPEED: 10,                    // Increased max speed
    FRICTION: 0.92,                   // Slightly less friction for more momentum
    DIAGONAL_MODIFIER: 0.707,
    BUBBLE_SPEED_THRESHOLD: 0.05,     // Even lower threshold for more bubbles
    BUBBLE_SPAWN_CHANCE: 0.9,         // Much higher chance for prominent trail
    BUBBLE_VELOCITY_MODIFIER: -0.4,   // More pronounced bubble movement
    BUBBLE_RANDOM_FACTOR: 1.2,        // More randomness for dynamic feel
    BOOST_SPEED_MULTIPLIER: 2.5,      // Speed boost multiplier
    BOOST_MAX_SPEED: 18               // Max speed during boost
};

export function updatePhysics(physics: Physics, keys: Record<string, boolean>, isBoostActive = false): Physics {
    let baseAcceleration = PHYSICS_CONFIG.ACCELERATION;
    let maxSpeed = PHYSICS_CONFIG.MAX_SPEED;
    
    // Apply boost multipliers
    if (isBoostActive) {
        baseAcceleration *= PHYSICS_CONFIG.BOOST_SPEED_MULTIPLIER;
        maxSpeed = PHYSICS_CONFIG.BOOST_MAX_SPEED;
    }
    
    const acceleration = {
        x: (keys.ArrowRight ? baseAcceleration : 0) - (keys.ArrowLeft ? baseAcceleration : 0),
        y: (keys.ArrowDown ? baseAcceleration : 0) - (keys.ArrowUp ? baseAcceleration : 0)
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
    if (speed > maxSpeed) {
        velocity.x = (velocity.x / speed) * maxSpeed;
        velocity.y = (velocity.y / speed) * maxSpeed;
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
