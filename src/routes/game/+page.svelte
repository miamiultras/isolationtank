<script lang="ts">
    import { spring } from 'svelte/motion';
    import { onMount } from 'svelte';
    import type { Spring } from 'svelte/motion';

    interface Ball {
        x: number;
        y: number;
        size: number;
    }

    interface Circle extends Ball {
        id: number;
        dx: number;
        dy: number;
    }

    // Physics parameters
    interface Physics {
        velocity: { x: number; y: number };
        acceleration: { x: number; y: number };
    }
    
    let physics: Physics = {
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 }
    };

    // Adjust physics constants
    const ACCELERATION = 0.2;    // Reduced from 0.5
    const MAX_SPEED = 6;         // Adjusted for better control
    const FRICTION = 0.98;       // Increased for smoother deceleration

    let playerBall: Spring<Ball>;
    let gameOver: boolean = false;
    let playerAlive: boolean = true;
    let animationFrameId: number;
    let circles: Circle[] = [];

    const BOARD_WIDTH = 3000;
    const BOARD_HEIGHT = 3000;
    let viewBox = { x: 0, y: 0, width: 0, height: 0 };

    // Update viewport spring settings for smoother camera
    let viewportSpring = spring(
        { x: 0, y: 0 },
        {
            stiffness: 0.05,    // Reduced for smoother camera movement
            damping: 0.9        // Increased for less oscillation
        }
    );

    // Add position spring for player movement
    let playerPositionSpring = spring(
        { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 },
        {
            stiffness: 0.3,
            damping: 0.8
        }
    );

    // Add movement control variables
    let keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };

    interface Bubble {
        id: number;
        x: number;
        y: number;
        size: number;
        opacity: number;
        velocity: { x: number; y: number };
    }

    let bubbles: Bubble[] = [];
    let nextBubbleId = 0;

    function createBubble(x: number, y: number, velocity: { x: number; y: number }): Bubble {
        return {
            id: nextBubbleId++,
            x,
            y,
            size: Math.random() * 3 + 2,
            opacity: 0.6,
            velocity: {
                x: velocity.x * -0.3 + (Math.random() - 0.5) * 0.5,
                y: velocity.y * -0.3 + (Math.random() - 0.5) * 0.5
            }
        };
    }

    function updateBubbles(): void {
        bubbles = bubbles
            .map(bubble => ({
                ...bubble,
                x: bubble.x + bubble.velocity.x,
                y: bubble.y + bubble.velocity.y,
                opacity: bubble.opacity - 0.02,
                size: bubble.size * 0.98
            }))
            .filter(bubble => bubble.opacity > 0);

        // Add new bubbles if player is moving
        if (Math.abs(physics.velocity.x) > 0.1 || Math.abs(physics.velocity.y) > 0.1) {
            const speed = Math.sqrt(physics.velocity.x ** 2 + physics.velocity.y ** 2);
            if (Math.random() < speed / MAX_SPEED) {
                const offset = Math.random() * $playerBall.size;
                const angle = Math.random() * Math.PI * 2;
                bubbles.push(
                    createBubble(
                        $playerBall.x + Math.cos(angle) * offset,
                        $playerBall.y + Math.sin(angle) * offset,
                        physics.velocity
                    )
                );
            }
        }
    }

    function getRandomPosition(max: number): number {
        return Math.floor(Math.random() * max);
    }

    function initializeCircles(width: number, height: number): Circle[] {
        // Fewer small balls with bigger size
        const smallBalls = Array.from({ length: 10 }, (_, i) => ({
            id: i + 21,
            x: getRandomPosition(BOARD_WIDTH),
            y: getRandomPosition(BOARD_HEIGHT),
            size: Math.random() * 5 + 8, // Size between 8 and 13
            dx: (Math.random() - 0.5) * 2,
            dy: (Math.random() - 0.5) * 2
        }));

        // Add medium balls with increased size
        const mediumBalls = Array.from({ length: 15 }, (_, i) => ({
            id: i + 41,
            x: getRandomPosition(BOARD_WIDTH),
            y: getRandomPosition(BOARD_HEIGHT),
            size: Math.random() * 8 + 15, // Size between 15 and 23
            dx: (Math.random() - 0.5) * 1.5,
            dy: (Math.random() - 0.5) * 1.5
        }));

        return [
            // Large, dangerous balls
            { id: 1, x: 100, y: 100, size: 45, dx: 2, dy: 1 },
            { id: 2, x: 600, y: 400, size: 55, dx: -2, dy: -1.5 },
            { id: 3, x: 700, y: 200, size: 40, dx: -1.5, dy: 1 },
            { id: 4, x: 500, y: 700, size: 50, dx: -1, dy: 1.5 },
            ...mediumBalls,
            ...smallBalls
        ];
    }

    onMount(() => {
        const width: number = window.innerWidth;
        const height: number = window.innerHeight;

        viewBox = {
            x: (BOARD_WIDTH - width) / 2,
            y: (BOARD_HEIGHT - height) / 2,
            width: width,
            height: height
        };

        viewportSpring.set({ x: viewBox.x, y: viewBox.y });

        playerBall = spring<Ball>(
            { 
                x: BOARD_WIDTH / 2, 
                y: BOARD_HEIGHT / 2, 
                size: 30  // Increased from 20 to 30
            },
            {
                stiffness: 0.3,  // Reduced for smoother movement
                damping: 0.8     // Adjusted for better feel
            }
        );

        circles = initializeCircles(BOARD_WIDTH, BOARD_HEIGHT);
        startGame();
        
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    });

    function checkCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        return distance < r1 + r2;
    }

    function updateCircles(): void {
        if (typeof window === 'undefined') return;

        circles = circles.map((circle: Circle) => {
            let newX = circle.x + circle.dx;
            let newY = circle.y + circle.dy;

            // Bounce off board boundaries instead of screen edges
            if (newX < 0 || newX > BOARD_WIDTH) circle.dx *= -1;
            if (newY < 0 || newY > BOARD_HEIGHT) circle.dy *= -1;

            return {
                ...circle,
                x: newX,
                y: newY
            };
        });
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (event.key in keys) {
            keys[event.key as keyof typeof keys] = true;
        }
    }

    function handleKeyUp(event: KeyboardEvent): void {
        if (event.key in keys) {
            keys[event.key as keyof typeof keys] = false;
        }
    }

    function updatePlayerPosition(): void {
        if (!playerBall || gameOver) return;

        // Calculate acceleration based on key presses
        physics.acceleration.x = 0;
        physics.acceleration.y = 0;

        if (keys.ArrowLeft) physics.acceleration.x -= ACCELERATION;
        if (keys.ArrowRight) physics.acceleration.x += ACCELERATION;
        if (keys.ArrowUp) physics.acceleration.y -= ACCELERATION;
        if (keys.ArrowDown) physics.acceleration.y += ACCELERATION;

        // Normalize diagonal acceleration
        if (physics.acceleration.x !== 0 && physics.acceleration.y !== 0) {
            physics.acceleration.x *= 0.707;
            physics.acceleration.y *= 0.707;
        }

        // Update velocity with acceleration
        physics.velocity.x += physics.acceleration.x;
        physics.velocity.y += physics.acceleration.y;

        // Apply friction
        physics.velocity.x *= FRICTION;
        physics.velocity.y *= FRICTION;

        // Limit maximum speed
        const speed = Math.sqrt(physics.velocity.x ** 2 + physics.velocity.y ** 2);
        if (speed > MAX_SPEED) {
            physics.velocity.x = (physics.velocity.x / speed) * MAX_SPEED;
            physics.velocity.y = (physics.velocity.y / speed) * MAX_SPEED;
        }

        // Update player position with velocity
        const newX = Math.max(0, Math.min(BOARD_WIDTH, $playerPositionSpring.x + physics.velocity.x));
        const newY = Math.max(0, Math.min(BOARD_HEIGHT, $playerPositionSpring.y + physics.velocity.y));

        // Preserve the current size when updating position
        const currentSize = $playerBall.size;

        // Update position spring first
        playerPositionSpring.set({ x: newX, y: newY });

        // Then update player ball with spring position, explicitly maintaining size
        playerBall.set({
            x: $playerPositionSpring.x,
            y: $playerPositionSpring.y,
            size: currentSize  // Explicitly preserve the size
        });

        // Update viewBox with much smoother following
        const margin = viewBox.width / 2.5; // Increased margin
        const centerX = $playerPositionSpring.x - viewBox.width / 2;
        const centerY = $playerPositionSpring.y - viewBox.height / 2;

        viewportSpring.set({ 
            x: Math.max(0, Math.min(BOARD_WIDTH - viewBox.width, centerX)),
            y: Math.max(0, Math.min(BOARD_HEIGHT - viewBox.height, centerY))
        });

        viewBox.x = $viewportSpring.x;
        viewBox.y = $viewportSpring.y;
    }

    function gameLoop(): void {
        if (!gameOver && playerBall) {
            updateCircles();
            updatePlayerPosition();
            updateBubbles();
            
            circles.forEach((circle: Circle) => {
                if (checkCollision($playerBall.x, $playerBall.y, $playerBall.size, 
                                 circle.x, circle.y, circle.size)) {
                    if ($playerBall.size > circle.size) {
                        // Remove eaten circle first
                        circles = circles.filter(c => c.id !== circle.id);
                        
                        // Direct size update with larger growth factor
                        const newSize = $playerBall.size + circle.size * 0.5;
                        
                        // Update the ball size directly
                        playerBall.set({
                            x: $playerBall.x,
                            y: $playerBall.y,
                            size: newSize
                        });
                        
                        // Log for debugging
                        console.log('Ball grown from', $playerBall.size, 'to', newSize);
                    } else {
                        gameOver = true;
                        playerAlive = false;
                    }
                }
            });
            
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }

    function startGame(): void {
        gameOver = false;
        playerAlive = true;
        if (circles.length < 5) {
            window.location.reload();
        }
        gameLoop();
    }
</script>

<svelte:window 
    on:keydown={handleKeyDown}
    on:keyup={handleKeyUp}
/>

<svelte:head>
    <title>Isolation Tank - Game</title>
    <meta name="description" content="Absorb smaller entities in space" />
</svelte:head>

<div class="game-container">
    <svg 
        role="application"
        viewBox="{$viewportSpring.x} {$viewportSpring.y} {viewBox.width} {viewBox.height}"
        class={gameOver ? '' : 'hide-cursor'}
    >
        <!-- Add bubbles before the player ball for correct layering -->
        {#each bubbles as bubble (bubble.id)}
            <circle 
                class="bubble"
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.size}
                style="opacity: {bubble.opacity}"
            />
        {/each}

        {#if playerBall && playerAlive}
            <circle 
                class="player-ball" 
                cx={$playerBall.x} 
                cy={$playerBall.y} 
                r={$playerBall.size}
            />
        {/if}

        {#each circles as circle}
            <circle 
                class="food-ball {circle.size > 20 ? 'danger' : ''}" 
                cx={circle.x} 
                cy={circle.y} 
                r={circle.size}
            />
        {/each}
    </svg>

    {#if gameOver}
        <div class="game-over">
            <h2>Game Over!</h2>
            <button on:click={() => window.location.reload()}>Play Again</button>
        </div>
    {/if}
</div>

<style>
    .game-container {
        width: 100vw;
        height: 100vh;
        background: 
            linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
            radial-gradient(circle at 50% 50%, #3a2218 0%, #1a0f0a 100%),
            url('../planet.webp');
        background-size: cover, cover, cover;
        background-position: center;
        background-blend-mode: overlay, multiply, normal;
        position: fixed;
        top: 0;
        left: 0;
        overflow: hidden;
    }

    .game-container::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background-image: 
            radial-gradient(circle at center, #d4a574 1px, transparent 1px),
            radial-gradient(circle at center, #8b4513 1px, transparent 1px);
        background-size: 50px 50px, 100px 100px;
        opacity: 0.15;
        z-index: 1;
    }

    svg {
        width: 100%;
        height: 100vh;
        position: relative;
        z-index: 2;
        display: block;
    }

    .hide-cursor {
        cursor: none;
    }

    .player-ball {
        fill: #ff7f50;
        filter: drop-shadow(0 0 15px rgba(255, 127, 80, 0.7));
    }

    .food-ball {
        fill: #00ffff;
        filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.6));
        animation: pulse 2s infinite ease-in-out;
    }

    .food-ball.danger {
        fill: #ff3333;
        filter: drop-shadow(0 0 12px rgba(255, 51, 51, 0.8));
    }

    .bubble {
        fill: rgba(255, 127, 80, 0.4);
        filter: blur(1px);
    }

    .game-over {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: white;
        background: rgba(0, 0, 0, 0.8);
        padding: 2rem;
        border-radius: 1rem;
        z-index: 3;
    }

    .game-over button {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        font-size: 1.2rem;
        background: #8b4513;
        color: white;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
    }

    .game-over button:hover {
        background: #d4a574;
    }

    @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
    }
</style>
