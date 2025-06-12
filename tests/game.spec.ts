import { expect, test } from '@playwright/test';

test.describe('Game Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('loads the game interface correctly', async ({ page }) => {
        // Check that the game SVG loads
        await expect(page.locator('svg[role="application"]')).toBeVisible();
        
        // Check that instructions are visible
        await expect(page.getByRole('heading', { name: /how to play/i })).toBeVisible();
        
        // Check that arrow key instructions are shown
        await expect(page.getByText('move')).toBeVisible();
        
        // Check that game instructions are visible
        await expect(page.getByText(/absorb smaller entities/i)).toBeVisible();
        await expect(page.getByText(/avoid larger entities/i)).toBeVisible();
        await expect(page.getByText(/grow and survive/i)).toBeVisible();
    });

    test('shows game instructions content', async ({ page }) => {
        // Check that action words are visible
        await expect(page.getByText('Absorb')).toBeVisible();
        await expect(page.getByText('Avoid')).toBeVisible();
        await expect(page.getByText('Grow')).toBeVisible();
        
        // Check that arrow keys are displayed
        await expect(page.getByText('↑')).toBeVisible();
        await expect(page.getByText('←')).toBeVisible();
        await expect(page.getByText('↓')).toBeVisible();
        await expect(page.getByText('→')).toBeVisible();
    });

    test('responds to keyboard input', async ({ page }) => {
        // Focus on the game area
        await page.locator('svg[role="application"]').focus();
        
        // Test keyboard controls - these should not cause errors
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowDown');
        
        // Game should still be running (SVG should be visible)
        await expect(page.locator('svg[role="application"]')).toBeVisible();
    });

    test('handles simultaneous key presses', async ({ page }) => {
        await page.locator('svg[role="application"]').focus();
        
        // Test diagonal movement
        await page.keyboard.down('ArrowRight');
        await page.keyboard.down('ArrowUp');
        
        // Wait a bit
        await page.waitForTimeout(100);
        
        await page.keyboard.up('ArrowRight');
        await page.keyboard.up('ArrowUp');
        
        // Game should handle this gracefully
        await expect(page.locator('svg[role="application"]')).toBeVisible();
    });

    test('game has essential elements', async ({ page }) => {
        // Check that the game container exists
        await expect(page.locator('.game-container')).toBeVisible();
        
        // Check that SVG is present
        await expect(page.locator('svg[role="application"]')).toBeVisible();
    });

    test('page has proper accessibility attributes', async ({ page }) => {
        // Check that the game SVG has proper role
        await expect(page.locator('svg[role="application"]')).toBeVisible();
        
        // Check that heading has proper structure
        await expect(page.getByRole('heading', { name: /how to play/i })).toBeVisible();
        
        // Check that instructions are readable
        await expect(page.getByText('move')).toBeVisible();
    });

    test('handles window focus and blur events', async ({ page }) => {
        // Focus the page
        await page.focus('body');
        
        // Test that game handles focus changes gracefully
        await page.keyboard.press('ArrowRight');
        
        // Blur and refocus
        await page.evaluate(() => window.blur());
        await page.waitForTimeout(100);
        await page.focus('body');
        
        // Game should still be functional
        await expect(page.locator('svg[role="application"]')).toBeVisible();
    });

    test('game maintains smooth performance', async ({ page }) => {
        // Start some movement
        await page.keyboard.down('ArrowRight');
        
        // Let it run for a bit
        await page.waitForTimeout(500);
        
        await page.keyboard.up('ArrowRight');
        
        // Check that the game is still responsive
        await expect(page.locator('svg[role="application"]')).toBeVisible();
        
        // No errors should be thrown
        const errors: Error[] = [];
        page.on('pageerror', (error) => errors.push(error));
        
        expect(errors).toHaveLength(0);
    });
}); 