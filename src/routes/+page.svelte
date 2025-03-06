<script lang="ts">
	import { gameStarted } from '../stores/game';
	import Instructions from '../components/Instructions.svelte';
	import GameScreen from '../components/GameScreen.svelte';
</script>

<svelte:head>
	<title>Isolation Tank</title>
	<meta name="description" content="Become the largest entity in space" />
</svelte:head>

{#if !$gameStarted}
	<div class="hero game-bg">
		<div class="content">
			<h1>Isolation Tank</h1>
			<p>Consume smaller entities. Grow larger. Dominate the cosmos.</p>
			<Instructions />
			<button on:click={() => gameStarted.set(true)}>Play Now</button>
		</div>
	</div>
{:else}
	<GameScreen />
{/if}

<style>
	.hero {
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
