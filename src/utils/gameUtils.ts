import type { Bubble, UpdateBubbles, Circle, GameConfig } from './entities';
import { calculateBubbleVelocity, PHYSICS_CONFIG, shouldSpawnBubble } from './physics';

export function getRandomPosition(max: number): number {
    return Math.floor(Math.random() * max);
}

export function initializeCircles(config: GameConfig): Circle[] {
    const smallBalls = Array.from({ length: 10 }, (_, i) => ({
        id: i + 21,
        x: getRandomPosition(config.BOARD_WIDTH),
        y: getRandomPosition(config.BOARD_HEIGHT),
        size: Math.random() * 5 + 8,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2
    }));

    const mediumBalls = Array.from({ length: 15 }, (_, i) => ({
        id: i + 41,
        x: getRandomPosition(config.BOARD_WIDTH),
        y: getRandomPosition(config.BOARD_HEIGHT),
        size: Math.random() * 8 + 15,
        dx: (Math.random() - 0.5) * 1.5,
        dy: (Math.random() - 0.5) * 1.5
    }));

    return [
        { id: 1, x: 100, y: 100, size: 45, dx: 2, dy: 1 },
        { id: 2, x: 600, y: 400, size: 55, dx: -2, dy: -1.5 },
        { id: 3, x: 700, y: 200, size: 40, dx: -1.5, dy: 1 },
        { id: 4, x: 500, y: 700, size: 50, dx: -1, dy: 1.5 },
        ...mediumBalls,
        ...smallBalls
    ];
}

export function checkCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance < r1 + r2;
}

export function calculateGrowth(currentSize: number, eatenSize: number): number {
    return currentSize + eatenSize * 0.5;
}

export function createBubble(x: number, y: number, velocity: { x: number; y: number }, nextId: number): Bubble {
    const angle = Math.atan2(velocity.y, velocity.x);
    const offsetDistance = 20;
    const randomAngleOffset = (Math.random() - 0.5) * 0.5;

    return {
        id: nextId,
        x: x - Math.cos(angle + randomAngleOffset) * offsetDistance,
        y: y - Math.sin(angle + randomAngleOffset) * offsetDistance,
        size: Math.random() * 3 + 2,
        opacity: 0.7,
        velocity: {
            x: velocity.x * PHYSICS_CONFIG.BUBBLE_VELOCITY_MODIFIER + (Math.random() - 0.5) * PHYSICS_CONFIG.BUBBLE_RANDOM_FACTOR,
            y: velocity.y * PHYSICS_CONFIG.BUBBLE_VELOCITY_MODIFIER + (Math.random() - 0.5) * PHYSICS_CONFIG.BUBBLE_RANDOM_FACTOR
        }
    };
}

export function updateBubbles({ bubbles, playerX, playerY, velocity, nextBubbleId }: UpdateBubbles): {
    updatedBubbles: Bubble[];
    newNextBubbleId: number;
} {
    const updatedBubbles = bubbles
        .map(bubble => ({
            ...bubble,
            x: bubble.x + bubble.velocity.x,
            y: bubble.y + bubble.velocity.y,
            opacity: bubble.opacity - 0.004,
            size: bubble.size * 0.997
        }))
        .filter(bubble => bubble.opacity > 0);

    if (shouldSpawnBubble(velocity)) {
        let id = nextBubbleId;
        // Spawn more bubbles for a more prominent trail
        const bubbleCount = Math.ceil(Math.random() * 4) + 1; // 1-5 bubbles
        for (let i = 0; i < bubbleCount; i++) {
            const bubbleVelocity = calculateBubbleVelocity(velocity);
            updatedBubbles.push(createBubble(playerX, playerY, bubbleVelocity, id++));
        }
        return { updatedBubbles, newNextBubbleId: id };
    }

    return { updatedBubbles, newNextBubbleId: nextBubbleId };
}
