<script>
	import './styles.css';
</script>

<div class="app">
	<main>
		<slot />
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		height: 100vh;
		margin: 0;
		padding: 0;
	}

	main {
		flex: 1;
		width: 100%;
		margin: 0;
		padding: 0;
	}
</style>
