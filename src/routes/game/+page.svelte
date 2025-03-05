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

    let playerBall: Spring<Ball>;
    let gameOver: boolean = false;
    let playerAlive: boolean = true;
    let animationFrameId: number;
    let circles: Circle[] = [];

    const BOARD_WIDTH = 3000;
    const BOARD_HEIGHT = 3000;
    let viewBox = { x: 0, y: 0, width: 0, height: 0 };

    // Add spring for smooth viewport movement
    let viewportSpring = spring(
        { x: 0, y: 0 },
        {
            stiffness: 0.1,  // Lower value = smoother movement
            damping: 0.8     // Higher value = less oscillation
        }
    );

    // Add movement control variables
    let keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };
    const PLAYER_SPEED = 5;

    function getRandomPosition(max: number): number {
        return Math.floor(Math.random() * max);
    }

    function initializeCircles(width: number, height: number): Circle[] {
        const smallBalls = Array.from({ length: 50 }, (_, i) => ({
            id: i + 21,
            x: getRandomPosition(BOARD_WIDTH),
            y: getRandomPosition(BOARD_HEIGHT),
            size: Math.random() * 3 + 4, // Size between 4 and 7
            dx: (Math.random() - 0.5) * 2,
            dy: (Math.random() - 0.5) * 2
        }));

        return [
            // Large, dangerous balls
            { id: 1, x: 100, y: 100, size: 30, dx: 2, dy: 1 },
            { id: 2, x: 600, y: 400, size: 40, dx: -2, dy: -1.5 },
            { id: 3, x: 700, y: 200, size: 25, dx: -1.5, dy: 1 },
            { id: 4, x: 500, y: 700, size: 35, dx: -1, dy: 1.5 },
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
                size: 20
            },
            {
                stiffness: 0.5,
                damping: 0.5
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

        let dx = 0;
        let dy = 0;

        if (keys.ArrowLeft) dx -= PLAYER_SPEED;
        if (keys.ArrowRight) dx += PLAYER_SPEED;
        if (keys.ArrowUp) dy -= PLAYER_SPEED;
        if (keys.ArrowDown) dy += PLAYER_SPEED;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707; // 1/√2
            dy *= 0.707;
        }

        playerBall.update(ball => {
            const newX = Math.max(0, Math.min(BOARD_WIDTH, ball.x + dx));
            const newY = Math.max(0, Math.min(BOARD_HEIGHT, ball.y + dy));
            
            // Update viewBox with smoother following
            const margin = viewBox.width / 3;
            let targetX = $viewportSpring.x;
            let targetY = $viewportSpring.y;

            if (newX > $viewportSpring.x + viewBox.width - margin) {
                targetX = Math.min(BOARD_WIDTH - viewBox.width, newX - viewBox.width + margin);
            } else if (newX < $viewportSpring.x + margin) {
                targetX = Math.max(0, newX - margin);
            }

            if (newY > $viewportSpring.y + viewBox.height - margin) {
                targetY = Math.min(BOARD_HEIGHT - viewBox.height, newY - viewBox.height + margin);
            } else if (newY < $viewportSpring.y + margin) {
                targetY = Math.max(0, newY - margin);
            }

            viewportSpring.set({ x: targetX, y: targetY });
            viewBox.x = $viewportSpring.x;
            viewBox.y = $viewportSpring.y;

            return {
                ...ball,
                x: newX,
                y: newY
            };
        });
    }

    function gameLoop(): void {
        if (!gameOver && playerBall) {
            updateCircles();
            updatePlayerPosition(); // Add player position update to game loop
            
            circles.forEach((circle: Circle) => {
                if (checkCollision($playerBall.x, $playerBall.y, $playerBall.size, 
                                 circle.x, circle.y, circle.size)) {
                    if ($playerBall.size > circle.size) {
                        circles = circles.filter(c => c.id !== circle.id);
                        playerBall.update((ball: Ball) => ({ 
                            ...ball, 
                            size: ball.size + circle.size * 0.2 
                        }));
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
    >
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
            linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
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
        cursor: none; /* Hides cursor */
        display: block;
    }

    .player-ball {
        fill: #8b4513;
        filter: drop-shadow(0 0 15px rgba(139, 69, 19, 0.7));
    }

    .food-ball {
        fill: #d4a574;
        filter: drop-shadow(0 0 8px rgba(212, 165, 116, 0.6));
        animation: pulse 2s infinite ease-in-out;
    }

    .food-ball.danger {
        fill: #ff4444;
        filter: drop-shadow(0 0 8px rgba(255, 68, 68, 0.6));
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
