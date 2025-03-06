<script lang="ts">
    import { spring } from 'svelte/motion';
    import { onMount } from 'svelte';
    import type { Spring } from 'svelte/motion';
    import type { Ball, Circle, Physics, Bubble } from '../utils/entities';
    import { gameOver as gameOverStore, playerAlive as playerAliveStore } from '../stores/game';
    import { updatePhysics, limitPosition } from '../utils/physics';
    import { gameConfig } from '../utils/entities';
    import { initializeCircles, checkCollision, calculateGrowth, updateBubbles } from '../utils/gameUtils';

    let physics: Physics = {
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 }
    };

    let playerBall: Spring<Ball>;
    let gameOver: boolean = false;
    let playerAlive: boolean = true;
    let animationFrameId: number;
    let circles: Circle[] = [];
    let viewBox = { x: 0, y: 0, width: 0, height: 0 };

    let viewportSpring = spring(
        { x: 0, y: 0 },
        {
            stiffness: 0.1,
            damping: 0.8
        }
    );

    let playerPositionSpring = spring(
        { x: gameConfig.BOARD_WIDTH / 2, y: gameConfig.BOARD_HEIGHT / 2 },
        {
            stiffness: 0.2,
            damping: 0.6
        }
    );

    let keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };

    let bubbles: Bubble[] = [];
    let nextBubbleId = 0;

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

    function startGame(): void {
        gameOver = false;
        playerAlive = true;
        circles = initializeCircles(gameConfig);
        physics = { velocity: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 } };
        bubbles = [];
        
        playerBall.set({ 
            x: gameConfig.BOARD_WIDTH / 2, 
            y: gameConfig.BOARD_HEIGHT / 2, 
            size: gameConfig.INITIAL_PLAYER_SIZE 
        });
        playerPositionSpring.set({ 
            x: gameConfig.BOARD_WIDTH / 2, 
            y: gameConfig.BOARD_HEIGHT / 2 
        });
        
        gameLoop();
    }

    function gameLoop(): void {
        if (!gameOver) {
            circles = circles.map((circle) => {
                let newX = circle.x + circle.dx;
                let newY = circle.y + circle.dy;

                if (newX < 0 || newX > gameConfig.BOARD_WIDTH) circle.dx *= -1;
                if (newY < 0 || newY > gameConfig.BOARD_HEIGHT) circle.dy *= -1;

                return { ...circle, x: newX, y: newY };
            });

            physics = updatePhysics(physics, keys);

            const newPos = limitPosition(
                $playerPositionSpring.x + physics.velocity.x,
                $playerPositionSpring.y + physics.velocity.y,
                gameConfig.BOARD_WIDTH,
                gameConfig.BOARD_HEIGHT
            );

            playerPositionSpring.set(newPos);
            playerBall.set({
                x: $playerPositionSpring.x,
                y: $playerPositionSpring.y,
                size: $playerBall.size
            });

            viewportSpring.set({
                x: Math.max(0, Math.min(gameConfig.BOARD_WIDTH - viewBox.width, 
                    $playerPositionSpring.x - viewBox.width / 2)),
                y: Math.max(0, Math.min(gameConfig.BOARD_HEIGHT - viewBox.height, 
                    $playerPositionSpring.y - viewBox.height / 2))
            });

            // Check collisions
            circles.forEach((circle) => {
                if (checkCollision($playerBall.x, $playerBall.y, $playerBall.size, 
                                 circle.x, circle.y, circle.size)) {
                    if ($playerBall.size > circle.size) {
                        circles = circles.filter(c => c.id !== circle.id);
                        playerBall.set({
                            ...$playerBall,
                            size: calculateGrowth($playerBall.size, circle.size)
                        });
                    } else {
                        gameOver = true;
                        playerAlive = false;
                    }
                }
            });

            const { updatedBubbles, newNextBubbleId } = updateBubbles({
                bubbles,
                playerX: $playerBall.x,
                playerY: $playerBall.y,
                velocity: physics.velocity,
                nextBubbleId
            });

            bubbles = updatedBubbles;
            nextBubbleId = newNextBubbleId;

            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }

    onMount(() => {
        const width: number = window.innerWidth;
        const height: number = window.innerHeight;

        viewBox = {
            x: (gameConfig.BOARD_WIDTH - width) / 2,
            y: (gameConfig.BOARD_HEIGHT - height) / 2,
            width: width,
            height: height
        };

        viewportSpring.set({ x: viewBox.x, y: viewBox.y });

        playerBall = spring<Ball>(
            { 
                x: gameConfig.BOARD_WIDTH / 2, 
                y: gameConfig.BOARD_HEIGHT / 2, 
                size: gameConfig.INITIAL_PLAYER_SIZE
            },
            {
                stiffness: 0.3,
                damping: 0.8
            }
        );

        startGame();
        
        return () => cancelAnimationFrame(animationFrameId);
    });

    $: {
        gameOverStore.set(gameOver);
        playerAliveStore.set(playerAlive);
    }
</script>

<svelte:window 
    on:keydown={handleKeyDown}
    on:keyup={handleKeyUp}
/>

<div class="game-container game-bg">
    <svg 
        role="application"
        viewBox="{$viewportSpring.x} {$viewportSpring.y} {viewBox.width} {viewBox.height}"
        class={gameOver ? '' : 'hide-cursor'}
    >
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
            <button on:click={() => startGame()}>Play Again</button>
        </div>
    {/if}
</div>

<style>
    .game-container {
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
        fill: #6F4E37;
        filter: drop-shadow(0 0 15px rgba(111, 78, 55, 0.7));
    }

    .food-ball {
        fill: #C4A484;
        filter: drop-shadow(0 0 8px rgba(196, 164, 132, 0.6));
        animation: pulse 2s infinite ease-in-out;
    }

    .food-ball.danger {
        fill: #4A0404;
        filter: drop-shadow(0 0 12px rgba(74, 4, 4, 0.5));
    }

    .bubble {
        fill: rgba(111, 78, 55, 0.25);
        filter: blur(3px) drop-shadow(0 0 3px rgba(111, 78, 55, 0.3));
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
