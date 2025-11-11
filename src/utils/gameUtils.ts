import type { Bubble, UpdateBubbles, Circle, GameConfig, HunterBall } from './entities';
import { calculateBubbleVelocity, PHYSICS_CONFIG, shouldSpawnBubble } from './physics';

export function getRandomPosition(max: number): number {
    return Math.floor(Math.random() * max);
}

export function createHunterBalls(config: GameConfig): HunterBall[] {
    // Create 5 hunter balls with different hunting capabilities
    return Array.from({ length: 5 }, (_, i) => ({
        id: i + 701, // Use 700+ range for hunter balls
        x: getRandomPosition(config.BOARD_WIDTH),
        y: getRandomPosition(config.BOARD_HEIGHT),
        size: Math.random() * 25 + 45, // 45-70 size - bigger than player start size (20)
        dx: 0, // Movement velocity
        dy: 0, // Movement velocity
        targetX: config.BOARD_WIDTH / 2,
        targetY: config.BOARD_HEIGHT / 2,
        huntingSpeed: Math.random() * 1 + 2.5, // 2.5-3.5 speed
        detectionRange: 400, // Screen view detection range
        isHunting: false,
        lastPlayerX: undefined,
        lastPlayerY: undefined
    }));
}

export function updateHunterBalls(
    hunters: HunterBall[], 
    playerX: number, 
    playerY: number,
    config: GameConfig,
    viewportX = 0,
    viewportY = 0,
    viewportWidth = 800,
    viewportHeight = 600
): HunterBall[] {
    return hunters.map(hunter => {
        const distanceToPlayer = Math.sqrt(
            Math.pow(playerX - hunter.x, 2) + Math.pow(playerY - hunter.y, 2)
        );

        // Check if hunter can see the player
        const canSeePlayer = (
            hunter.x >= viewportX - 200 && 
            hunter.x <= viewportX + viewportWidth + 200 &&
            hunter.y >= viewportY - 200 && 
            hunter.y <= viewportY + viewportHeight + 200
        ) || distanceToPlayer <= hunter.detectionRange;

        // Only update direction every 2 seconds OR when starting to hunt
        const timeSeconds = Math.floor(Date.now() / 2000);
        const shouldUpdateDirection = timeSeconds % (hunter.id + 1) === 0 || (!hunter.isHunting && canSeePlayer);

        if (canSeePlayer && shouldUpdateDirection) {
            // Calculate direction to player (like regular balls do)
            const deltaX = playerX - hunter.x;
            const deltaY = playerY - hunter.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance > 0) {
                // Set fixed velocity toward player - like regular balls!
                hunter.dx = (deltaX / distance) * hunter.huntingSpeed;
                hunter.dy = (deltaY / distance) * hunter.huntingSpeed;
                hunter.isHunting = true;
            }
        } else if (!canSeePlayer) {
            // Patrol behavior when can't see player
            hunter.isHunting = false;
            if (shouldUpdateDirection) {
                hunter.dx = (Math.random() - 0.5) * 2;
                hunter.dy = (Math.random() - 0.5) * 2;
            }
        }
        // If not updating direction, keep current dx/dy (like regular balls!)

        // Move exactly like regular balls - just add dx/dy to position
        const newX = hunter.x + hunter.dx;
        const newY = hunter.y + hunter.dy;

        // Bounce off walls exactly like regular balls
        if (newX < 0 || newX > config.BOARD_WIDTH) hunter.dx *= -1;
        if (newY < 0 || newY > config.BOARD_HEIGHT) hunter.dy *= -1;

        // Keep position valid
        hunter.x = Math.max(0, Math.min(config.BOARD_WIDTH, newX));
        hunter.y = Math.max(0, Math.min(config.BOARD_HEIGHT, newY));

        return hunter;
    });
}

export function initializeCircles(config: GameConfig): Circle[] {
    // Reduced some ball counts to make room for hunters
    // Tiny balls - easy food, fast and erratic (20 balls, reduced from 25)
    const tinyBalls = Array.from({ length: 20 }, (_, i) => ({
        id: i + 101,
        x: getRandomPosition(config.BOARD_WIDTH),
        y: getRandomPosition(config.BOARD_HEIGHT),
        size: Math.random() * 3 + 4, // 4-7 size
        dx: (Math.random() - 0.5) * 3, // Fast and chaotic
        dy: (Math.random() - 0.5) * 3
    }));

    // Small balls - good growth food, moderate speed (15 balls, reduced from 20)
    const smallBalls = Array.from({ length: 15 }, (_, i) => ({
        id: i + 201,
        x: getRandomPosition(config.BOARD_WIDTH),
        y: getRandomPosition(config.BOARD_HEIGHT),
        size: Math.random() * 6 + 8, // 8-14 size
        dx: (Math.random() - 0.5) * 2.2, // Moderate speed
        dy: (Math.random() - 0.5) * 2.2
    }));

    // Medium balls - moderate threat/food, balanced speed (12 balls, reduced from 15)
    const mediumBalls = Array.from({ length: 12 }, (_, i) => ({
        id: i + 301,
        x: getRandomPosition(config.BOARD_WIDTH),
        y: getRandomPosition(config.BOARD_HEIGHT),
        size: Math.random() * 10 + 15, // 15-25 size
        dx: (Math.random() - 0.5) * 1.8, // Balanced
        dy: (Math.random() - 0.5) * 1.8
    }));

    // Large danger balls - major threats, deliberate movement (6 balls, reduced from 8)
    const largeBalls = Array.from({ length: 6 }, (_, i) => ({
        id: i + 401,
        x: getRandomPosition(config.BOARD_WIDTH),
        y: getRandomPosition(config.BOARD_HEIGHT),
        size: Math.random() * 15 + 30, // 30-45 size
        dx: (Math.random() - 0.5) * 1.4, // Threatening but not too fast
        dy: (Math.random() - 0.5) * 1.4
    }));

    // Giant predators - extreme danger, slow but intimidating (3 balls, reduced from 4)
    const giantBalls = Array.from({ length: 3 }, (_, i) => ({
        id: i + 501,
        x: getRandomPosition(config.BOARD_WIDTH),
        y: getRandomPosition(config.BOARD_HEIGHT),
        size: Math.random() * 20 + 50, // 50-70 size
        dx: (Math.random() - 0.5) * 1, // Slow but menacing
        dy: (Math.random() - 0.5) * 1
    }));

    return [
        ...tinyBalls,    // 20 balls
        ...smallBalls,   // 15 balls  
        ...mediumBalls,  // 12 balls
        ...largeBalls,   // 6 balls
        ...giantBalls    // 3 balls
        // Total: 56 regular balls + 5 hunter balls = 61 total
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
