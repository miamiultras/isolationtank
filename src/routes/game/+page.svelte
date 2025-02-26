<script>
    import { spring } from 'svelte/motion';
    import { onMount } from 'svelte';

    let playerBall;

    onMount(() => {
        playerBall = spring(
            { 
                x: window.innerWidth / 2, 
                y: window.innerHeight / 2, 
                size: 20 
            },
            {
                stiffness: 0.1,
                damping: 0.25
            }
        );
    });

    let circles = [
        { id: 1, x: 100, y: 100, size: 10 },
        { id: 2, x: 200, y: 300, size: 15 },
        { id: 3, x: 400, y: 300, size: 8 },
        { id: 4, x: 600, y: 400, size: 12 },
        { id: 5, x: 300, y: 500, size: 10 },
        { id: 6, x: 700, y: 200, size: 7 },
        { id: 7, x: 800, y: 600, size: 14 },
        { id: 8, x: 500, y: 700, size: 9 }
    ];

    function checkCollision(x1, y1, r1, x2, y2, r2) {
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        return distance < r1 + r2;
    }

    function handleMouseMove(event) {
        if (!playerBall) return;
        
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        playerBall.set({ 
            x: x, 
            y: y, 
            size: $playerBall.size 
        });

        circles = circles.filter(circle => {
            if (checkCollision(x, y, $playerBall.size, circle.x, circle.y, circle.size)) {
                if ($playerBall.size > circle.size) {
                    playerBall.update(ball => ({ ...ball, size: ball.size + circle.size * 0.2 }));
                    return false;
                }
            }
            return true;
        });
    }
</script>

<svelte:head>
    <title>Space Absorber - Game</title>
    <meta name="description" content="Absorb smaller entities in space" />
</svelte:head>

<div class="game-container">
    <svg on:mousemove={handleMouseMove}>
        {#if playerBall}
            <circle 
                class="player-ball" 
                cx={$playerBall.x} 
                cy={$playerBall.y} 
                r={$playerBall.size}
            />
        {/if}

        {#each circles as circle}
            <circle 
                class="food-ball" 
                cx={circle.x} 
                cy={circle.y} 
                r={circle.size}
            />
        {/each}
    </svg>
</div>

<style>
    .game-container {
        width: 100vw;
        height: 100vh;
        background: 
            linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
            radial-gradient(circle at 50% 50%, #3a2218 0%, #1a0f0a 100%),
            url('/planets.webp');
        background-size: cover, cover, cover;
        background-position: center;
        background-blend-mode: overlay, multiply, normal;
        position: relative;
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

    @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
    }
</style>
