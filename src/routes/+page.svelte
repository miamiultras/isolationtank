<svelte:head>
	<title>Home</title>
	<meta name="description" content="Image gallery app" />
</svelte:head>

<section>
	<div class="hero">
		<h1 class="font-color">Isolation Tank</h1>
		<h2 class="font-color">Lorem ipsum dolor</h2>
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
		position: relative;
		height: 100%;
	}

	.hero {
		margin-top: -6em;
		text-align: center;
	}

	h1 {
		width: 100%;
		font-size: 3.5em;
		margin-bottom: 0;
	}

	h2 {
		font-size: 1.5em;
	}

	@media (min-width: 720px) {
		h1 {
			width: 100%;
			font-size: 4.5em;
			margin-bottom: 0;
		}

		h2 {
			font-size: 2em;
		}
	}
</style>
