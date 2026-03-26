<script lang="ts">
    import { spring } from 'svelte/motion';
    import { onMount } from 'svelte';
    import type { Spring } from 'svelte/motion';
    import type { Ball, Circle, Physics, Bubble, HunterBall } from '../utils/entities';
    import { gameOver as gameOverStore, playerAlive as playerAliveStore } from '../stores/game';
    import { updatePhysics, limitPosition } from '../utils/physics';
    import { gameConfig } from '../utils/entities';
    import { initializeCircles, checkCollision, calculateGrowth, updateBubbles, createHunterBalls, updateHunterBalls } from '../utils/gameUtils';

    let physics: Physics = {
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 }
    };

    let playerBall: Spring<Ball>;
    let gameOver: boolean = false;
    let playerAlive: boolean = true;
    let animationFrameId: number;
    let circles: Circle[] = [];
    let hunterBalls: HunterBall[] = [];
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
        // Guard against accessing playerBall before it's initialized
        if (!playerBall || !$playerBall) return;
        
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
        hunterBalls = createHunterBalls(gameConfig);
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

            // Update hunter balls - proximity lock-on and movement mirroring
            hunterBalls = hunterBalls.map((hunter) => {
                const distanceToPlayer = Math.sqrt(
                    Math.pow($playerBall.x - hunter.x, 2) + Math.pow($playerBall.y - hunter.y, 2)
                );

                // Start hunting when player gets close
                if (distanceToPlayer <= 300 && !hunter.isHunting) {
                    hunter.isHunting = true;
                    // Initial lock-on direction
                    const deltaX = $playerBall.x - hunter.x;
                    const deltaY = $playerBall.y - hunter.y;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    if (distance > 0) {
                        hunter.dx = (deltaX / distance) * hunter.huntingSpeed;
                        hunter.dy = (deltaY / distance) * hunter.huntingSpeed;
                    }
                }

                if (hunter.isHunting) {
                    // Mirror player movement direction while slowly adjusting course
                    const playerMovementX = physics.velocity.x;
                    const playerMovementY = physics.velocity.y;
                    
                    // Combine current direction with player movement (70% current, 30% player movement)
                    hunter.dx = hunter.dx * 0.7 + playerMovementX * 0.3;
                    hunter.dy = hunter.dy * 0.7 + playerMovementY * 0.3;
                    
                    // Slowly adjust toward player (very gradual course correction)
                    const deltaX = $playerBall.x - hunter.x;
                    const deltaY = $playerBall.y - hunter.y;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    
                    if (distance > 0) {
                        const correctionStrength = 0.05; // Very gentle correction
                        const targetDx = (deltaX / distance) * hunter.huntingSpeed;
                        const targetDy = (deltaY / distance) * hunter.huntingSpeed;
                        
                        hunter.dx = hunter.dx * (1 - correctionStrength) + targetDx * correctionStrength;
                        hunter.dy = hunter.dy * (1 - correctionStrength) + targetDy * correctionStrength;
                    }

                    // Stop hunting if player gets too far away
                    if (distanceToPlayer > 500) {
                        hunter.isHunting = false;
                    }
                } else {
                    // Random patrol when not hunting
                    if (Math.abs(hunter.dx) < 0.5 && Math.abs(hunter.dy) < 0.5) {
                        hunter.dx = (Math.random() - 0.5) * 1;
                        hunter.dy = (Math.random() - 0.5) * 1;
                    }
                }

                // Move exactly like regular balls
                let newX = hunter.x + hunter.dx;
                let newY = hunter.y + hunter.dy;

                // Bounce off walls exactly like regular balls
                if (newX < 0 || newX > gameConfig.BOARD_WIDTH) hunter.dx *= -1;
                if (newY < 0 || newY > gameConfig.BOARD_HEIGHT) hunter.dy *= -1;

                return { ...hunter, x: newX, y: newY };
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

            // Ball vs Ball interactions - bigger eats smaller
            for (let i = circles.length - 1; i >= 0; i--) {
                const circle = circles[i];
                let wasEaten = false;
                
                // Check against other circles
                for (let j = circles.length - 1; j >= 0; j--) {
                    if (i !== j) {
                        const otherCircle = circles[j];
                        if (checkCollision(circle.x, circle.y, circle.size, 
                                         otherCircle.x, otherCircle.y, otherCircle.size)) {
                            // Bigger eats smaller
                            if (circle.size > otherCircle.size * 1.2) { // Need 20% size advantage
                                circles[i].size = calculateGrowth(circle.size, otherCircle.size);
                                circles.splice(j, 1);
                                if (j < i) i--; // Adjust index after removal
                                wasEaten = false;
                                break;
                            } else if (otherCircle.size > circle.size * 1.2) {
                                circles[j].size = calculateGrowth(otherCircle.size, circle.size);
                                circles.splice(i, 1);
                                wasEaten = true;
                                break;
                            }
                        }
                    }
                }
                
                if (wasEaten) continue;
                
                // Check player vs circle collision
                if (checkCollision($playerBall.x, $playerBall.y, $playerBall.size, 
                                 circle.x, circle.y, circle.size)) {
                    if ($playerBall.size > circle.size * 1.1) { // Player needs smaller advantage
                        circles = circles.filter(c => c.id !== circle.id);
                        
                        // Smooth eating animation - gradual size increase
                        const currentSize = $playerBall.size;
                        const targetSize = calculateGrowth(currentSize, circle.size);
                        const sizeIncrease = targetSize - currentSize;
                        
                        // Animate size growth over 200ms
                        const growthSteps = 10;
                        const stepSize = sizeIncrease / growthSteps;
                        let step = 0;
                        
                        const growthInterval = setInterval(() => {
                            step++;
                            const newSize = currentSize + (stepSize * step);
                            playerBall.set({
                                ...$playerBall,
                                size: newSize
                            });
                            
                            if (step >= growthSteps) {
                                clearInterval(growthInterval);
                                playerBall.set({
                                    ...$playerBall,
                                    size: targetSize
                                });
                            }
                        }, 20);
                        
                        // Regenerate energy when eating balls
                        boostEnergy = Math.min(100, boostEnergy + ENERGY_PER_BALL);
                    } else {
                        gameOver = true;
                        playerAlive = false;
                    }
                }
            }

            // Hunter ball interactions
            for (let i = hunterBalls.length - 1; i >= 0; i--) {
                const hunter = hunterBalls[i];
                let wasEaten = false;
                
                // Hunter vs regular circles
                for (let j = circles.length - 1; j >= 0; j--) {
                    const circle = circles[j];
                    if (checkCollision(hunter.x, hunter.y, hunter.size, 
                                     circle.x, circle.y, circle.size)) {
                        if (hunter.size > circle.size * 1.1) {
                            hunterBalls[i].size = calculateGrowth(hunter.size, circle.size);
                            circles.splice(j, 1);
                        } else if (circle.size > hunter.size * 1.3) { // Circles need bigger advantage vs hunters
                            circles[j].size = calculateGrowth(circle.size, hunter.size);
                            hunterBalls.splice(i, 1);
                            wasEaten = true;
                            break;
                        }
                    }
                }
                
                if (wasEaten) continue;
                
                // Hunter vs hunter
                for (let j = hunterBalls.length - 1; j >= 0; j--) {
                    if (i !== j) {
                        const otherHunter = hunterBalls[j];
                        if (checkCollision(hunter.x, hunter.y, hunter.size, 
                                         otherHunter.x, otherHunter.y, otherHunter.size)) {
                            if (hunter.size > otherHunter.size * 1.2) {
                                hunterBalls[i].size = calculateGrowth(hunter.size, otherHunter.size);
                                hunterBalls.splice(j, 1);
                                if (j < i) i--;
                                break;
                            } else if (otherHunter.size > hunter.size * 1.2) {
                                hunterBalls[j].size = calculateGrowth(otherHunter.size, hunter.size);
                                hunterBalls.splice(i, 1);
                                wasEaten = true;
                                break;
                            }
                        }
                    }
                }
                
                if (wasEaten) continue;
                
                // Player vs hunter collision
                if (checkCollision($playerBall.x, $playerBall.y, $playerBall.size, 
                                 hunter.x, hunter.y, hunter.size)) {
                    if ($playerBall.size > hunter.size * 1.15) { // Need 15% advantage vs hunters
                        hunterBalls = hunterBalls.filter(h => h.id !== hunter.id);
                        
                        // Smooth eating animation for hunters too
                        const currentSize = $playerBall.size;
                        const targetSize = calculateGrowth(currentSize, hunter.size);
                        const sizeIncrease = targetSize - currentSize;
                        
                        const growthSteps = 12; // Slightly longer for hunters
                        const stepSize = sizeIncrease / growthSteps;
                        let step = 0;
                        
                        const growthInterval = setInterval(() => {
                            step++;
                            const newSize = currentSize + (stepSize * step);
                            playerBall.set({
                                ...$playerBall,
                                size: newSize
                            });
                            
                            if (step >= growthSteps) {
                                clearInterval(growthInterval);
                                playerBall.set({
                                    ...$playerBall,
                                    size: targetSize
                                });
                            }
                        }, 18);
                        
                        // Extra energy bonus for defeating a hunter!
                        boostEnergy = Math.min(100, boostEnergy + ENERGY_PER_BALL * 2);
                    } else {
                        gameOver = true;
                        playerAlive = false;
                    }
                }
            }

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
                class="food-ball {circle.size > 40 ? 'giant-danger' : circle.size > 25 ? 'big-danger' : circle.size > 15 ? 'medium-threat' : circle.size > 8 ? 'small-food' : 'tiny-food'}" 
                cx={circle.x} 
                cy={circle.y} 
                r={circle.size}
            />
        {/each}

        {#each hunterBalls as hunter}
            <circle 
                class="hunter-ball" 
                class:hunting={hunter.isHunting}
                cx={hunter.x} 
                cy={hunter.y} 
                r={hunter.size}
            />
            {#if hunter.isHunting}
                <circle 
                    class="hunter-detection-ring"
                    cx={hunter.x} 
                    cy={hunter.y} 
                    r={hunter.detectionRange}
                />
            {/if}
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
        filter: drop-shadow(0 0 8px rgba(196, 164, 132, 0.6));
        animation: pulse 2s infinite ease-in-out;
    }

    /* Tiny food - very safe, bright green */
    .food-ball.tiny-food {
        fill: #4CAF50;
        filter: drop-shadow(0 0 6px rgba(76, 175, 80, 0.7));
    }

    /* Small food - safe, light green */
    .food-ball.small-food {
        fill: #8BC34A;
        filter: drop-shadow(0 0 8px rgba(139, 195, 74, 0.6));
    }

    /* Medium threat - neutral, yellow-orange */
    .food-ball.medium-threat {
        fill: #FF9800;
        filter: drop-shadow(0 0 10px rgba(255, 152, 0, 0.6));
    }

    /* Big danger - threatening, red */
    .food-ball.big-danger {
        fill: #F44336;
        filter: drop-shadow(0 0 12px rgba(244, 67, 54, 0.7));
        animation: dangerPulse 1.5s infinite ease-in-out;
    }

    /* Giant danger - extreme threat, dark red */
    .food-ball.giant-danger {
        fill: #B71C1C;
        filter: drop-shadow(0 0 15px rgba(183, 28, 28, 0.8));
        animation: dangerPulse 1s infinite ease-in-out;
    }

    /* Hunter ball styles */
    .hunter-ball {
        fill: #2C1810;
        stroke: #8B4513;
        stroke-width: 2;
        filter: drop-shadow(0 0 12px rgba(44, 24, 16, 0.8));
        animation: hunterIdle 2.5s infinite ease-in-out;
    }

    .hunter-ball.hunting {
        fill: #FF4444;
        stroke: #CC0000;
        stroke-width: 3;
        filter: drop-shadow(0 0 20px rgba(255, 68, 68, 0.9));
        animation: hunterHunt 0.8s infinite ease-in-out;
    }

    .hunter-detection-ring {
        fill: none;
        stroke: rgba(255, 68, 68, 0.3);
        stroke-width: 2;
        opacity: 0.5;
        animation: detectionPulse 1.5s infinite ease-in-out;
    }

    @keyframes hunterIdle {
        0%, 100% { 
            transform: scale(1);
            filter: drop-shadow(0 0 12px rgba(44, 24, 16, 0.8));
        }
        50% { 
            transform: scale(1.05);
            filter: drop-shadow(0 0 15px rgba(44, 24, 16, 0.9));
        }
    }

    @keyframes hunterHunt {
        0%, 100% { 
            transform: scale(1);
            filter: drop-shadow(0 0 20px rgba(255, 68, 68, 0.9));
        }
        50% { 
            transform: scale(1.15);
            filter: drop-shadow(0 0 30px rgba(255, 68, 68, 1));
        }
    }

    @keyframes detectionPulse {
        0%, 100% { 
            opacity: 0.2;
            stroke-width: 2;
        }
        50% { 
            opacity: 0.5;
            stroke-width: 3;
        }
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

    @keyframes dangerPulse {
        0% { 
            opacity: 0.8;
            transform: scale(1);
        }
        50% { 
            opacity: 1;
            transform: scale(1.05);
        }
        100% { 
            opacity: 0.8;
            transform: scale(1);
        }
    }
</style>
