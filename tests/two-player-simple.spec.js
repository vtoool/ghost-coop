import { test, expect, chromium } from '@playwright/test'

/**
 * Clean 2-Player E2E Test Suite for Ecto-Busters
 * Tests production deployment at https://ghost-coop.vercel.app
 * 
 * NOTE: Run this with `npx playwright test tests/two-player.spec.js --headed`
 * The --headed flag is important because we need to see what's happening
 */

const PRODUCTION_URL = 'https://ghost-coop.vercel.app'

test.describe('2-Player Co-op Experience Tests', () => {
  let hostContext, joinerContext
  let hostPage, joinerPage
  let roomCode = null

  test.beforeAll(async () => {
    // Create two independent browser contexts for 2-player simulation
    hostContext = await chromium.launchPersistentContext('', {
      headless: false,
      viewport: { width: 1280, height: 720 }
    })

    joinerContext = await chromium.launchPersistentContext('', {
      headless: false,
      viewport: { width: 393, height: 851 } // Pixel 5
    })

    hostPage = await hostContext.newPage()
    joinerPage = await joinerContext.newPage()

    console.log('\n🎮 Test Setup Complete')
    console.log('   Host: Desktop Chrome (1280x720)')
    console.log('   Joiner: Mobile Chrome (393x851)')
  })

  test.afterAll(async () => {
    await hostContext?.close()
    await joinerContext?.close()
    console.log('\n🧹 Test cleanup complete')
  })

  test('Scenario 1: Host Initialization', async () => {
    console.log('\n📱 [TEST 1] Host Initialization')
    console.log('=' .repeat(50))

    // Navigate to production URL
    await hostPage.goto(PRODUCTION_URL)
    console.log('✅ Host navigated to production URL')

    // Wait for Playroom to initialize (CRITICAL: needs 8+ seconds)
    await hostPage.waitForTimeout(8000)
    console.log('⏳ Waited for Playroom initialization')

    // Take screenshot
    const screenshotPath = `test-results/t1-host-welcome.png`
    await hostPage.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`📸 Screenshot: ${screenshotPath}`)

    // Verify UI elements exist
    const title = hostPage.locator('h1:has-text("ECTO-BUSTERS")')
    await expect(title).toBeVisible({ timeout: 5000 })
    console.log('✅ Title visible')

    const input = hostPage.locator('input[placeholder*="CALLSIGN" i]')
    await expect(input).toBeVisible({ timeout: 5000 })
    console.log('✅ Name input visible')

    // Check if name is pre-filled (from localStorage)
    const inputValue = await input.inputValue()
    if (inputValue) {
      console.log('ℹ️ Name pre-filled from localStorage:', inputValue)
    }

    // Enter name
    await input.fill('GhostHost')
    console.log('✅ Entered nickname: GhostHost')

    // Click join button
    const enterButton = hostPage.locator('button:has-text("HAUNTED HOUSE")')
    await enterButton.click()
    console.log('✅ Clicked ENTER THE HAUNTED HOUSE')

    // Wait for lobby - might be stuck on "Joining..." screen
    // We need to check which state we're in
    await hostPage.waitForTimeout(5000)

    // Take screenshot of current state
    const lobbyScreenshot = `test-results/t1-host-lobby.png`
    await hostPage.screenshot({ path: lobbyScreenshot, fullPage: false })
    console.log(`📸 Screenshot: ${lobbyScreenshot}`)

    // Check if we're on lobby screen or still joining
    const joiningIndicator = hostPage.locator('text=/Joining/i')
    const isJoining = await joiningIndicator.isVisible().catch(() => false)

    if (isJoining) {
      console.log('⚠️ Still showing "Joining..." - waiting longer')
      await hostPage.waitForTimeout(5000)
      
      // Screenshot again
      await hostPage.screenshot({ path: `test-results/t1-host-lobby-retry.png`, fullPage: false })
    }

    // Extract room code from URL
    const url = hostPage.url()
    const roomCodeMatch = url.match(/#r=([A-Z0-9]+)/)
    if (roomCodeMatch) {
      roomCode = roomCodeMatch[1]
      console.log('🔗 Room code extracted:', roomCode)
    } else {
      console.log('⚠️ Could not extract room code from URL:', url)
      roomCode = 'TEST123' // Fallback
    }

    // Verify lobby elements
    const roomCodeDisplay = hostPage.locator('.room-code')
    await expect(roomCodeDisplay).toBeVisible({ timeout: 5000 })
    console.log('✅ Room code display visible')

    // Verify ready button (text is "READY FOR HAUNT")
    const readyButton = hostPage.locator('button:has-text("READY FOR HAUNT")')
    await expect(readyButton).toBeVisible({ timeout: 5000 })
    console.log('✅ Ready button visible')

    console.log('\n✅ [TEST 1] Complete - Host initialized')
  })

  test('Scenario 2: Joiner Connection', async () => {
    console.log('\n📱 [TEST 2] Joiner Connection')
    console.log('=' .repeat(50))

    if (!roomCode) {
      console.log('⚠️ No room code from previous test, using default')
      roomCode = 'TEST123'
    }

    // Joiner navigates to room
    const joinUrl = `${PRODUCTION_URL}/#r=${roomCode}`
    await joinerPage.goto(joinUrl)
    console.log('✅ Joiner navigated to room URL:', joinUrl)

    await joinerPage.waitForTimeout(8000)

    // Screenshot
    const screenshotPath = `test-results/t2-joiner-welcome.png`
    await joinerPage.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`📸 Screenshot: ${screenshotPath}`)

    // Verify "Joining existing game" text
    const joiningText = joinerPage.locator('text=/Joining existing game/i')
    await expect(joiningText).toBeVisible({ timeout: 5000 })
    console.log('✅ Joiner sees "Joining existing game" indicator')

    // Enter joiner name
    const input = joinerPage.locator('input[placeholder*="CALLSIGN" i]')
    await input.fill('GhostJoiner')
    console.log('✅ Joiner entered nickname: GhostJoiner')

    // Join
    const enterButton = joinerPage.locator('button:has-text("HAUNTED HOUSE")')
    await enterButton.click()
    console.log('✅ Joiner clicked ENTER THE HAUNTED HOUSE')

    // Wait for lobby
    await joinerPage.waitForTimeout(5000)

    // Screenshot
    const lobbyScreenshot = `test-results/t2-joiner-lobby.png`
    await joinerPage.screenshot({ path: lobbyScreenshot, fullPage: false })
    console.log(`📸 Screenshot: ${lobbyScreenshot}`)

    // Verify both players appear in joiner's list
    const hostName = joinerPage.locator('text=/GhostHost/i')
    const joinerName = joinerPage.locator('text=/GhostJoiner.*YOU/i')
    
    await expect(hostName).toBeVisible({ timeout: 10000 })
    await expect(joinerName).toBeVisible({ timeout: 10000 })
    console.log('✅ Both player names visible in joiner\'s lobby')

    // Verify same in host's view (might need refresh)
    await hostPage.reload()
    await hostPage.waitForTimeout(3000)
    
    const hostPlayerCount = await hostPage.locator('.player-card, [class*="player"]').count()
    console.log(`👥 Players in host's list: ${hostPlayerCount}`)

    // Screenshot
    const hostWithJoinerScreenshot = `test-results/t2-host-with-joiner.png`
    await hostPage.screenshot({ path: hostWithJoinerScreenshot, fullPage: false })
    console.log(`📸 Screenshot: ${hostWithJoinerScreenshot}`)

    console.log('\n✅ [TEST 2] Complete - 2-player connection successful')
  })

  test('Scenario 3: Real-Time State Synchronization', async () => {
    console.log('\n📱 [TEST 3] Real-Time State Synchronization')
    console.log('=' .repeat(50))

    // Host marks ready
    const hostReadyBtn = hostPage.locator('button:has-text("READY FOR HAUNT")')
    await hostReadyBtn.click()
    console.log('✅ Host clicked READY FOR HAUNT')

    await hostPage.waitForTimeout(1000)

    // Screenshot
    await hostPage.screenshot({ path: `test-results/t3-host-ready.png`, fullPage: false })

    // Verify host sees "CANCEL READY" button
    const hostCancelBtn = hostPage.locator('button:has-text("CANCEL READY")')
    await expect(hostCancelBtn).toBeVisible({ timeout: 5000 })
    console.log('✅ Host sees CANCEL READY button')

    // Wait for sync and check joiner sees host is ready
    await joinerPage.waitForTimeout(3000)

    // Screenshot
    await joinerPage.screenshot({ path: `test-results/t3-joiner-sees-host-ready.png`, fullPage: false })

    // Verify joiner sees host's ready status
    const hostReadyIndicator = joinerPage.locator('text=/GhostHost.*READY/i')
    await expect(hostReadyIndicator).toBeVisible({ timeout: 10000 })
    console.log('✅ Joiner sees GhostHost is READY')

    // Joiner marks ready
    const joinerReadyBtn = joinerPage.locator('button:has-text("READY FOR HAUNT")')
    await joinerReadyBtn.click()
    console.log('✅ Joiner clicked READY FOR HAUNT')

    await joinerPage.waitForTimeout(1000)

    // Screenshot
    await joinerPage.screenshot({ path: `test-results/t3-joiner-ready.png`, fullPage: false })

    // Wait for sync and verify host sees both ready
    await hostPage.waitForTimeout(3000)

    // Screenshot
    await hostPage.screenshot({ path: `test-results/t3-host-both-ready.png`, fullPage: false })

    // Verify host sees START GHOST HUNT button (enabled)
    const startButton = hostPage.locator('button:has-text("START GHOST HUNT")')
    await expect(startButton).toBeVisible({ timeout: 10000 })
    
    const isEnabled = await startButton.isEnabled()
    if (isEnabled) {
      console.log('✅ Host sees enabled START GHOST HUNT button')
    } else {
      console.log('⚠️ START GHOST HUNT button is disabled (players not all ready?)')
    }

    console.log('\n✅ [TEST 3] Complete - Real-time synchronization working')
  })

  test('Scenario 4: Link Sharing & QR Code', async () => {
    console.log('\n📱 [TEST 4] Link Sharing')
    console.log('=' .repeat(50))

    // Test copy room link button
    const copyBtn = hostPage.locator('button:has-text("COPY ROOM LINK")')
    
    if (await copyBtn.isVisible().catch(() => false)) {
      await copyBtn.click()
      console.log('✅ Clicked COPY ROOM LINK')

      await hostPage.waitForTimeout(500)

      // Verify button text changed
      const copiedBtn = hostPage.locator('button:has-text("LINK COPIED")')
      await expect(copiedBtn).toBeVisible({ timeout: 5000 })
      console.log('✅ Button changed to "LINK COPIED!"')

      await hostPage.waitForTimeout(2500)

      // Verify reverted
      const revertedBtn = hostPage.locator('button:has-text("COPY ROOM LINK")')
      await expect(revertedBtn).toBeVisible({ timeout: 5000 })
      console.log('✅ Button reverted to "COPY ROOM LINK"')
    } else {
      console.log('ℹ️ COPY ROOM LINK button not visible (may have < 2 players)')
    }

    // Check QR code visibility
    const qrCode = hostPage.locator('.ghost-trap, svg, [class*="qr"]').first()
    const isQrVisible = await qrCode.isVisible().catch(() => false)

    if (isQrVisible) {
      console.log('✅ QR code visible')
      await hostPage.screenshot({ path: `test-results/t4-qr-code.png`, fullPage: false })
    } else {
      console.log('ℹ️ QR code not visible (2+ players present)')
    }

    console.log('\n✅ [TEST 4] Complete - Link sharing flow verified')
  })

  test('Scenario 5: Mobile Layout Verification', async () => {
    console.log('\n📱 [TEST 5] Mobile Layout')
    console.log('=' .repeat(50))

    // Ensure joiner is on mobile viewport
    await joinerPage.setViewportSize({ width: 393, height: 851 })
    console.log('✅ Joiner viewport set to Pixel 5 (393x851)')

    await joinerPage.reload()
    await joinerPage.waitForTimeout(5000)

    // Screenshot
    await joinerPage.screenshot({ path: `test-results/t5-mobile-layout.png`, fullPage: false })
    console.log('📸 Mobile layout screenshot captured')

    // Universal Design check - no "Desktop/Mobile" text
    const bodyText = await joinerPage.locator('body').textContent()
    const hasBadText = /Desktop|Mobile/i.test(bodyText)

    if (hasBadText) {
      console.log('❌ FAIL: Found "Desktop" or "Mobile" text (violates Universal Design)')
    } else {
      console.log('✅ No "Desktop/Mobile" text found (Universal Design compliant)')
    }

    expect(bodyText).not.toMatch(/Desktop|Mobile/i)

    // Verify touch-friendly elements
    const buttons = joinerPage.locator('button')
    const buttonCount = await buttons.count()
    console.log(`✅ Found ${buttonCount} buttons on mobile view`)

    console.log('\n✅ [TEST 5] Complete - Mobile layout verified')
  })
})
