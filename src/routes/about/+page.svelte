<script>
	import { spring } from 'svelte/motion';

	let coords = spring(
		{ x: 50, y: 50 },
		{
			stiffness: 0.1,
			damping: 0.33
		}
	);

	let size = spring(20);

	let circles = [
		{ id: 1, x: 500, y: 500, size: 20 },
		{ id: 2, x: 200, y: 300, size: 10 },
		{ id: 3, x: 400, y: 300, size: 20 },
		{ id: 4, x: 400, y: 800, size: 40 },
		{ id: 5, x: 300, y: 500, size: 30 }
	];
</script>

<svelte:head>
	<title>Animation playground</title>
	<meta name="description" content="Animation playground" />
</svelte:head>

<div>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<svg
		on:mousemove={(e) => {
			const matchedCircle = circles.find(
				(circle) =>
					e.clientX < circle.x + 20 &&
					e.clientX > circle.x - 20 &&
					e.clientY < circle.y + 20 &&
					e.clientY > circle.y - 20
			);
			if (matchedCircle) {
				size.update((size) => size + matchedCircle.size);
				circles = circles.filter((c) => c.id !== matchedCircle.id);
			}
		}}
	>
		<circle class="main-circle" cx={$coords.x} cy={$coords.y} r={$size} />

		{#each circles as circle}
			<circle cx={circle.x} cy={circle.y} r={circle.size} />
		{/each}
	</svg>
</div>

<style>
	div {
		width: 100vw;
		height: calc(100vh - 100px);
	}
	svg {
		width: 100%;
		height: 100%;
	}
	circle {
		fill: var(--color-theme-1);
		z-index: 10;
	}
	.main-circle {
		z-index: 100;
	}
</style>
