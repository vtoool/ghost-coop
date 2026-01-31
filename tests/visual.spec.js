import { test, expect } from '@playwright/test'

/**
 * Comprehensive Visual Testing Suite for Ecto-Busters
 * Tests production deployment at https://ghost-coop.vercel.app
 * Captures screenshots for AI visual analysis
 */

test.describe('Ecto-Busters Lobby Visual Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to production URL
    await page.goto('https://ghost-coop.vercel.app')
    // Wait for Playroom to initialize
    await page.waitForTimeout(3000)
  })

  test('welcome screen - desktop view', async ({ page }, testInfo) => {
    // Force desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    
    await page.waitForTimeout(2000)
    
    // Take screenshot of welcome screen
    const screenshotPath = `test-results/welcome-desktop-${testInfo.project.name}.png`
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false,
    })
    
    console.log(`📸 Screenshot saved: ${screenshotPath}`)
    
    // Verify spooky title exists
    const title = page.locator('h1:has-text("ECTO-BUSTERS")')
    await expect(title).toBeVisible()
    
    // Verify input exists
    const input = page.locator('input[placeholder*="CALLSIGN" i]')
    await expect(input).toBeVisible()
    
    // Verify HOST/JOIN badge (not Desktop/Mobile)
    const roleBadge = page.locator('.room-code')
    await expect(roleBadge).toBeVisible()
    
    const badgeText = await roleBadge.textContent()
    expect(badgeText).toMatch(/HOST MODE|JOIN MODE/)
    expect(badgeText).not.toMatch(/Desktop|Mobile/i)
  })

  test('welcome screen - mobile view', async ({ page }, testInfo) => {
    // Force mobile viewport
    await page.setViewportSize({ width: 393, height: 851 })
    
    await page.waitForTimeout(2000)
    
    const screenshotPath = `test-results/welcome-mobile-${testInfo.project.name}.png`
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false,
    })
    
    console.log(`📸 Screenshot saved: ${screenshotPath}`)
    
    // Verify title is responsive
    const title = page.locator('h1:has-text("ECTO-BUSTERS")')
    await expect(title).toBeVisible()
    
    // Check no Desktop/Mobile text exists
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toMatch(/Desktop|Mobile/i)
  })

  test('lobby screen with name entered - host view', async ({ page }, testInfo) => {
    // Enter name first
    const input = page.locator('input[placeholder*="CALLSIGN" i]')
    await input.fill('TestGhostHunter')
    
    const enterButton = page.locator('button:has-text("HAUNTED HOUSE")')
    await enterButton.click()
    
    // Wait for lobby to load (look for h1 since lobby-container class is on div)
    await page.waitForSelector('h1:has-text("ECTO-BUSTERS")', { timeout: 5000 })
    await page.waitForTimeout(2000)
    
    const screenshotPath = `test-results/lobby-host-${testInfo.project.name}.png`
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false,
    })
    
    console.log(`📸 Screenshot saved: ${screenshotPath}`)
    
    // Verify lobby elements
    const roomCode = page.locator('.room-code')
    await expect(roomCode).toBeVisible()
    
    // Verify ready button exists
    const readyButton = page.locator('button:has-text("READY")')
    await expect(readyButton).toBeVisible()
  })

  test('verify spooky orange theme elements', async ({ page }, testInfo) => {
    // Check for orange color in computed styles
    const title = page.locator('h1')
    await expect(title).toBeVisible()
    
    // Get computed color
    const color = await title.evaluate(el => {
      return window.getComputedStyle(el).color
    })
    
    console.log(`🎨 Title color: ${color}`)
    
    // Should be orange-ish (rgb(255, 107, 53) or similar)
    expect(color).toContain('255')
  })

  test('capture full UI for style guide verification', async ({ page }, testInfo) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // Enter name to see full lobby
    const input = page.locator('input[placeholder*="CALLSIGN" i]')
    await input.fill('StyleCheck')
    
    const enterButton = page.locator('button:has-text("HAUNTED HOUSE")')
    await enterButton.click()
    
    await page.waitForSelector('h1:has-text("ECTO-BUSTERS")', { timeout: 5000 })
    await page.waitForTimeout(3000) // Wait for animations
    
    const screenshotPath = `test-results/style-guide-verification-${testInfo.project.name}.png`
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false,
    })
    
    console.log(`📸 Style guide verification screenshot: ${screenshotPath}`)
    console.log('✅ Check this screenshot for:')
    console.log('   - Creepster font on title')
    console.log('   - JetBrains Mono on UI text')
    console.log('   - Orange glow effects')
    console.log('   - Cyan ready states')
    console.log('   - Ghost trap QR styling')
    console.log('   - Floating player card animations')
    console.log('   - No Desktop/Mobile text')
  })
})
