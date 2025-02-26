<script>
    import { goto } from '$app/navigation';
</script>

<svelte:head>
    <title>Space Absorber</title>
    <meta name="description" content="Become the largest entity in space" />
</svelte:head>

<div class="hero">
    <div class="content">
        <h1>Space Absorber</h1>
        <p>Consume smaller entities. Grow larger. Dominate the cosmos.</p>
        <button on:click={() => goto('/game')}>Play Now</button>
    </div>
</div>

<style>
    .hero {
        width: 100vw;
        height: 100vh;
        background: 
            linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
            radial-gradient(circle at 50% 50%, #3a2218 0%, #1a0f0a 100%),
            url('./planet.webp');
        background-size: cover, cover, cover;
        background-position: center;
        background-blend-mode: overlay, multiply, normal;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .content {
        position: relative;
        z-index: 2;
        text-align: center;
        color: #ffffff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    h1 {
        font-size: 4rem;
        margin-bottom: 1rem;
        text-shadow: 0 0 20px rgba(0, 128, 255, 0.5);
        color: #ffffff;
    }

    p {
        font-size: 1.5rem;
        margin-bottom: 2rem;
        color: #ffffff;
        opacity: 0.9;
    }

    button {
        background: #2c1810;
        border: 2px solid #3a2218;
        padding: 1rem 2rem;
        font-size: 1.2rem;
        color: white;
        border-radius: 50px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
    }

    button:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 20px rgba(44, 24, 16, 0.6);
        background: #3a2218;
    }
</style>
