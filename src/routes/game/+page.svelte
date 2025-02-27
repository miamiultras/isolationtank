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

    function getRandomPosition(max: number): number {
        return Math.floor(Math.random() * max);
    }

    function initializeCircles(width: number, height: number): Circle[] {
        return [
            // Large, dangerous balls
            { id: 1, x: 100, y: 100, size: 30, dx: 2, dy: 1 },
            { id: 2, x: 600, y: 400, size: 40, dx: -2, dy: -1.5 },
            { id: 3, x: 700, y: 200, size: 25, dx: -1.5, dy: 1 },
            { id: 4, x: 500, y: 700, size: 35, dx: -1, dy: 1.5 },
            // Small balls to eat
            { id: 5, x: getRandomPosition(width), y: getRandomPosition(height), size: 5, dx: 1, dy: 1 },
            { id: 6, x: getRandomPosition(width), y: getRandomPosition(height), size: 6, dx: -1, dy: 0.8 },
            { id: 7, x: getRandomPosition(width), y: getRandomPosition(height), size: 4, dx: 0.7, dy: -1 },
            { id: 8, x: getRandomPosition(width), y: getRandomPosition(height), size: 7, dx: -0.9, dy: 1.2 },
            { id: 9, x: getRandomPosition(width), y: getRandomPosition(height), size: 5, dx: 1.1, dy: -0.8 },
            { id: 10, x: getRandomPosition(width), y: getRandomPosition(height), size: 6, dx: -1.2, dy: 0.9 },
            { id: 11, x: getRandomPosition(width), y: getRandomPosition(height), size: 4, dx: 0.8, dy: 1.1 },
            { id: 12, x: getRandomPosition(width), y: getRandomPosition(height), size: 5, dx: -0.7, dy: -1.2 },
            { id: 13, x: getRandomPosition(width), y: getRandomPosition(height), size: 7, dx: 1.3, dy: -0.7 },
            { id: 14, x: getRandomPosition(width), y: getRandomPosition(height), size: 6, dx: -0.8, dy: 1.3 },
            { id: 15, x: getRandomPosition(width), y: getRandomPosition(height), size: 5, dx: 0.9, dy: -1.1 },
            { id: 16, x: getRandomPosition(width), y: getRandomPosition(height), size: 4, dx: -1.1, dy: 0.7 },
            { id: 17, x: getRandomPosition(width), y: getRandomPosition(height), size: 6, dx: 1.2, dy: -0.9 },
            { id: 18, x: getRandomPosition(width), y: getRandomPosition(height), size: 5, dx: -0.9, dy: 1.1 },
            { id: 19, x: getRandomPosition(width), y: getRandomPosition(height), size: 7, dx: 0.7, dy: -1.3 },
            { id: 20, x: getRandomPosition(width), y: getRandomPosition(height), size: 4, dx: -1.3, dy: 0.8 }
        ];
    }

    onMount(() => {
        const width: number = window.innerWidth;
        const height: number = window.innerHeight;

        playerBall = spring<Ball>(
            { 
                x: width / 2, 
                y: height / 2, 
                size: 20
            },
            {
                stiffness: 0.5,
                damping: 0.5
            }
        );

        circles = initializeCircles(width, height);
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

            if (newX < 0 || newX > window.innerWidth) circle.dx *= -1;
            if (newY < 0 || newY > window.innerHeight) circle.dy *= -1;

            return {
                ...circle,
                x: newX,
                y: newY
            };
        });
    }

    function gameLoop(): void {
        if (!gameOver && playerBall) {
            updateCircles();
            
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

    function handleMouseMove(event: MouseEvent): void {
        if (!playerBall || gameOver) return;
        
        const svg = event.currentTarget as SVGElement;
        const rect = svg.getBoundingClientRect();
        
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        playerBall.set({
            x: mouseX,
            y: mouseY,
            size: $playerBall.size
        });
    }
</script>

<svelte:head>
    <title>Space Absorber - Game</title>
    <meta name="description" content="Absorb smaller entities in space" />
</svelte:head>

<div class="game-container">
    <svg 
        role="application"
        on:mousemove|preventDefault={handleMouseMove}
        on:mouseenter={() => document.body.style.cursor = 'none'}
        on:mouseleave={() => document.body.style.cursor = 'default'}
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
        height: 100%;
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
