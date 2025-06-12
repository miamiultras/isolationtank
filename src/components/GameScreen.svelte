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
            stiffness: 0.3,  // More bouncy
            damping: 0.5     // Less damping for more dynamic movement
        }
    );

    let keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        Space: false
    };

    let bubbles: Bubble[] = [];
    let nextBubbleId = 0;
    
    // Speed boost system
    let boostEnergy = 100; // 0-100%
    let isBoostActive = false;
    let boostTimeLeft = 0;
    const BOOST_DURATION = 10000; // 10 seconds
    const BOOST_COST = 50; // Energy cost
    const ENERGY_PER_BALL = 8; // Energy gained per ball eaten

    // Dynamic visual effects
    $: currentSpeed = Math.sqrt(physics.velocity.x ** 2 + physics.velocity.y ** 2);
    $: isMoving = currentSpeed > 0.5;
    $: speedIntensity = Math.min(currentSpeed / 8, 1); // Normalize to 0-1

    function handleKeyDown(event: KeyboardEvent): void {
        if (event.key in keys) {
            keys[event.key as keyof typeof keys] = true;
        }
        
        // Handle spacebar boost
        if (event.key === ' ' && !isBoostActive && boostEnergy >= BOOST_COST) {
            activateBoost();
            event.preventDefault(); // Prevent page scroll
        }
    }

    function handleKeyUp(event: KeyboardEvent): void {
        if (event.key in keys) {
            keys[event.key as keyof typeof keys] = false;
        }
    }

    function activateBoost(): void {
        isBoostActive = true;
        boostTimeLeft = BOOST_DURATION;
        boostEnergy -= BOOST_COST;
        
        // Decrease size when boosting (strategic cost)
        const currentSize = $playerBall.size;
        const sizeCost = currentSize * 0.15; // 15% size reduction
        playerBall.set({
            ...$playerBall,
            size: Math.max(gameConfig.INITIAL_PLAYER_SIZE, currentSize - sizeCost)
        });
        
        // Countdown timer
        const boostInterval = setInterval(() => {
            boostTimeLeft -= 100;
            if (boostTimeLeft <= 0) {
                isBoostActive = false;
                boostTimeLeft = 0;
                clearInterval(boostInterval);
            }
        }, 100);
    }

    function startGame(): void {
        gameOver = false;
        playerAlive = true;
        circles = initializeCircles(gameConfig);
        physics = { velocity: { x: 0, y: 0 }, acceleration: { x: 0, y: 0 } };
        bubbles = [];
        
        // Reset boost system
        boostEnergy = 100;
        isBoostActive = false;
        boostTimeLeft = 0;
        
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

            physics = updatePhysics(physics, keys, isBoostActive);

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
                        
                        // Regenerate energy when eating balls
                        boostEnergy = Math.min(100, boostEnergy + ENERGY_PER_BALL);
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
                stiffness: 0.4,  // More responsive
                damping: 0.6     // Less damping for bouncier feel
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
                class:moving={isMoving}
                cx={$playerBall.x} 
                cy={$playerBall.y} 
                r={$playerBall.size * (1 + speedIntensity * 0.1)}
                style="--speed-intensity: {speedIntensity}; --current-speed: {currentSpeed}"
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

    <!-- Boost UI -->
    <div class="boost-ui">
        <div class="energy-container">
            <div class="energy-label">Energy</div>
            <div class="energy-bar">
                <div 
                    class="energy-fill" 
                    style="width: {boostEnergy}%"
                    class:low-energy={boostEnergy < BOOST_COST}
                ></div>
            </div>
            <div class="energy-text">{Math.round(boostEnergy)}%</div>
        </div>
        
        {#if isBoostActive}
            <div class="boost-active">
                <div class="boost-label">🚀 BOOST ACTIVE</div>
                <div class="boost-timer">{Math.ceil(boostTimeLeft / 1000)}s</div>
            </div>
        {:else if boostEnergy >= BOOST_COST}
            <div class="boost-ready">Press SPACE for boost!</div>
        {/if}
    </div>

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
        transition: filter 0.2s ease-out, r 0.1s ease-out;
    }

    .player-ball.moving {
        filter: drop-shadow(0 0 calc(20px + 15px * var(--speed-intensity)) rgba(111, 78, 55, calc(0.8 + 0.4 * var(--speed-intensity))));
        animation: playerPulse 0.3s ease-in-out infinite alternate;
    }

    @keyframes playerPulse {
        0% { 
            filter: drop-shadow(0 0 calc(20px + 15px * var(--speed-intensity)) rgba(111, 78, 55, calc(0.8 + 0.4 * var(--speed-intensity))));
        }
        100% { 
            filter: drop-shadow(0 0 calc(25px + 20px * var(--speed-intensity)) rgba(111, 78, 55, calc(0.9 + 0.5 * var(--speed-intensity))));
        }
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
        fill: rgba(111, 78, 55, 0.35);
        filter: blur(2px) drop-shadow(0 0 8px rgba(111, 78, 55, 0.5));
        animation: bubbleFloat 1s ease-out forwards;
    }

    @keyframes bubbleFloat {
        0% {
            fill: rgba(111, 78, 55, 0.6);
            filter: blur(1px) drop-shadow(0 0 12px rgba(111, 78, 55, 0.8));
        }
        100% {
            fill: rgba(111, 78, 55, 0.1);
            filter: blur(4px) drop-shadow(0 0 4px rgba(111, 78, 55, 0.2));
        }
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

    /* Boost UI Styles */
    .boost-ui {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(0, 0, 0, 0.8);
        padding: 1rem;
        border-radius: 0.5rem;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        z-index: 10;
        min-width: 200px;
    }

    .energy-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .energy-label {
        color: white;
        font-size: 0.9rem;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .energy-bar {
        width: 100%;
        height: 20px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .energy-fill {
        height: 100%;
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        transition: width 0.3s ease, background 0.3s ease;
        border-radius: 10px;
    }

    .energy-fill.low-energy {
        background: linear-gradient(90deg, #FF5722, #FF9800);
        animation: energyPulse 1s ease-in-out infinite alternate;
    }

    .energy-text {
        color: white;
        font-size: 0.8rem;
        text-align: center;
        font-weight: bold;
    }

    .boost-active {
        text-align: center;
        color: #FFD700;
        font-weight: bold;
        animation: boostGlow 0.5s ease-in-out infinite alternate;
    }

    .boost-label {
        font-size: 0.9rem;
        margin-bottom: 0.2rem;
    }

    .boost-timer {
        font-size: 1.2rem;
        color: #FFF;
    }

    .boost-ready {
        text-align: center;
        color: #4CAF50;
        font-size: 0.8rem;
        font-weight: bold;
        animation: readyPulse 2s ease-in-out infinite;
    }

    @keyframes energyPulse {
        0% { opacity: 0.7; }
        100% { opacity: 1; }
    }

    @keyframes boostGlow {
        0% { 
            text-shadow: 0 0 5px #FFD700;
            transform: scale(1);
        }
        100% { 
            text-shadow: 0 0 15px #FFD700, 0 0 25px #FFD700;
            transform: scale(1.05);
        }
    }

    @keyframes readyPulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
    }

    @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
    }
</style>
