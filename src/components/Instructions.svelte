<script>
    export let showInGame = false;
</script>

<div class="instructions {showInGame ? 'in-game' : ''}">
    <h2>How to Play</h2>
    <div class="controls">
        <div class="control-group">
            <div class="arrows">
                <span class="key">↑</span>
                <div class="horizontal-arrows">
                    <span class="key">←</span>
                    <span class="key">↓</span>
                    <span class="key">→</span>
                </div>
            </div>
            <span class="control-label">move</span>
        </div>
        
        <div class="control-group">
            <div class="single-key">
                <span class="key space-key">SPACE</span>
            </div>
            <span class="control-label">boost (costs energy & size)</span>
        </div>
    </div>
    <ul>
        <li><span class="highlight">Absorb</span> smaller entities</li>
        <li><span class="highlight">Avoid</span> larger entities</li>
        <li><span class="highlight">Grow</span> and survive</li>
        <li><span class="highlight">Boost</span> for speed, but lose size & energy</li>
        <li><span class="highlight">Eat</span> balls to regenerate energy</li>
    </ul>
</div>

<style>
    .instructions {
        color: #fff;
        text-align: center;
        padding: 1.5rem;
        margin: 2rem 0;
    }

    .in-game {
        position: absolute;
        top: 1rem;
        left: 1rem;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 1rem;
        backdrop-filter: blur(5px);
        z-index: 10;
    }

    h2 {
        font-size: 1.4rem;
        margin-bottom: 1.5rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .control-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .arrows {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.3rem;
    }

    .horizontal-arrows {
        display: flex;
        gap: 0.3rem;
    }

    .single-key {
        display: flex;
        justify-content: center;
    }

    .key {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 0.5rem;
        font-size: 1.2rem;
        margin: 0.2rem;
    }

    .control-label {
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        opacity: 0.8;
        text-align: center;
    }

    .space-key {
        min-width: 4rem;
        font-size: 0.9rem;
    }

    ul {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    li {
        font-size: 1.1rem;
        letter-spacing: 0.05em;
    }

    .highlight {
        color: #d4a574;
        font-weight: bold;
    }
</style>
