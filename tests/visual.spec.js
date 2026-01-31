import { test, expect } from '@playwright/test'

/**
 * Visual Regression Test - The Eyes
 * Captures screenshots of the Lobby UI for AI analysis
 */
test.describe('Lobby Visual Tests', () => {
  test('lobby container renders correctly', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173')
    
    // Wait for the lobby container to be visible
    // The bootstrap process takes a moment for Playroom to initialize
    await page.waitForSelector('.lobby-container, body', {
      timeout: 10000,
    })
    
    // Wait a bit for any animations to complete
    await page.waitForTimeout(1000)
    
    // Take a screenshot for visual analysis
    await page.screenshot({ 
      path: 'lobby-debug.png',
      fullPage: false,
    })
    
    // Basic assertions to verify UI elements exist
    const heading = page.locator('h1:has-text("ECTO-BUSTERS")')
    await expect(heading).toBeVisible()
    
    console.log('✓ Visual test completed. Check lobby-debug.png for UI analysis.')
  })

  test('name input screen renders', async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    // Wait for the app to load
    await page.waitForTimeout(2000)
    
    // Check for name input or lobby
    const input = page.locator('input[placeholder*="name" i]')
    const lobby = page.locator('.lobby-container')
    
    // Either input or lobby should be visible
    const hasInput = await input.isVisible().catch(() => false)
    const hasLobby = await lobby.isVisible().catch(() => false)
    
    expect(hasInput || hasLobby).toBeTruthy()
    
    await page.screenshot({ 
      path: 'lobby-input-debug.png',
      fullPage: false,
    })
  })
})
