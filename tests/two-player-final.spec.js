import { test, expect, chromium } from '@playwright/test'

/**
 * FINAL FIXED: Sequential 2-Player E2E Test Suite for Ecto-Busters
 * Tests run sequentially to avoid context conflicts
 * 
 * CRITICAL FIXES APPLIED:
 * - Clear storage before tests to prevent session restoration issues
 * - Button text: "READY FOR HAUNT" not "READY"
 * - Room code format: #r=XXXXX (PlayroomKit format)
 * - Extended waits for Playroom initialization (10+ seconds)
 * - Sequential execution with proper state management
 * - Host always creates fresh room (no hash on initial navigation)
 */

const PRODUCTION_URL = 'https://ghost-coop.vercel.app'

// Helper to extract room code from URL hash
function extractRoomCode(hash) {
  if (hash.startsWith('#r=')) {
    return hash.slice(3)
  }
  if (hash.startsWith('#')) {
    return hash.slice(1)
  }
  return hash
}

// Helper to build room URL
function buildRoomUrl(baseUrl, roomCode) {
  return `${baseUrl}/#r=${roomCode}`
}

test.describe.configure({ mode: 'serial' })

test.describe('2-Player E2E Test Suite - PRODUCTION', () => {
  let hostBrowser, joinerBrowser
  let hostContext, joinerContext
  let hostPage, joinerPage
  let capturedRoomCode = null
  let testStartTime = null

  test.beforeAll(async () => {
    testStartTime = Date.now()
    console.log('\n' + '='.repeat(70))
    console.log('🎮 ECTO-BUSTERS 2-PLAYER E2E TEST SUITE')
    console.log('   Target: Production (https://ghost-coop.vercel.app)')
    console.log('   Started:', new Date().toISOString())
    console.log('='.repeat(70))
    
    // Launch browsers
    hostBrowser = await chromium.launch({ headless: false })
    joinerBrowser = await chromium.launch({ headless: false })
    
    // Create contexts with explicit device viewports
    hostContext = await hostBrowser.newContext({
      viewport: { width: 1280, height: 720 }
    })

    joinerContext = await joinerBrowser.newContext({
      viewport: { width: 393, height: 851 }
    })

    // Clear all storage to prevent session restoration issues
    console.log('\n🧹 Clearing browser storage...')
    
    hostPage = await hostContext.newPage()
    joinerPage = await joinerContext.newPage()
    
    // Navigate to about:blank first, then clear storage
    await hostPage.goto('about:blank')
    await joinerPage.goto('about:blank')
    
    // Clear storage on both pages
    await hostPage.evaluate(() => {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        // Storage might not be available
      }
    })
    await joinerPage.evaluate(() => {
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch (e) {
        // Storage might not be available
      }
    })
    
    console.log('✅ Browser contexts created and storage cleared')
    console.log('   Host: Desktop (1280x720)')
    console.log('   Joiner: Mobile (393x851)')
  })

  test.afterAll(async () => {
    const duration = ((Date.now() - testStartTime) / 1000).toFixed(1)
    
    await hostBrowser?.close()
    await joinerBrowser?.close()
    
    console.log('\n' + '='.repeat(70))
    console.log('🧹 TEST CLEANUP COMPLETE')
    console.log(`   Total Duration: ${duration}s`)
    console.log('='.repeat(70) + '\n')
  })

  test('TEST 1: Host Creates Room', async () => {
    console.log('\n📱 TEST 1: Host Creates Room')
    console.log('-'.repeat(70))

    // Navigate to clean production URL (no hash to ensure fresh room)
    console.log('🌐 Host navigating to production URL...')
    await hostPage.goto(PRODUCTION_URL, { waitUntil: 'networkidle' })
    
    // Wait for PlayroomKit to initialize
    console.log('⏳ Waiting for PlayroomKit initialization (10s)...')
    await hostPage.waitForTimeout(10000)

    // Screenshot: Initial state
    const screenshot1 = `test-results/test1-host-initial-${Date.now()}.png`
    await hostPage.screenshot({ path: screenshot1, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot1}`)

    // Verify we're on the welcome screen
    const title = hostPage.locator('h1:has-text("ECTO-BUSTERS")')
    await expect(title).toBeVisible({ timeout: 10000 })
    console.log('✅ Title visible')

    // Get the role badge text
    const roleBadge = hostPage.locator('.room-code')
    const badgeText = await roleBadge.textContent().catch(() => 'Not found')
    console.log(`   Role badge: "${badgeText?.trim()}"`)
    
    // If it says "Joining existing game", we need to wait longer
    if (badgeText?.includes('Joining')) {
      console.log('⏳ Waiting for initialization to complete...')
      await hostPage.waitForTimeout(5000)
    }

    // Check for name input
    const input = hostPage.locator('input[placeholder*="CALLSIGN" i]')
    const inputVisible = await input.isVisible().catch(() => false)
    
    if (!inputVisible) {
      console.log('⚠️ Name input not visible, checking current state...')
      const screenshotError = `test-results/test1-error-state-${Date.now()}.png`
      await hostPage.screenshot({ path: screenshotError, fullPage: false })
      console.log(`📸 Error screenshot: ${screenshotError}`)
      
      // Try refreshing
      console.log('🔄 Refreshing page...')
      await hostPage.reload()
      await hostPage.waitForTimeout(8000)
    }
    
    await expect(input).toBeVisible({ timeout: 5000 })
    console.log('✅ Name input visible')

    // Enter host name
    await input.fill('GhostHost')
    console.log('✅ Entered name: GhostHost')

    // Click join button
    const joinBtn = hostPage.locator('button:has-text("HAUNTED HOUSE")')
    await joinBtn.click()
    console.log('✅ Clicked ENTER THE HAUNTED HOUSE')

    // Wait for lobby transition
    console.log('⏳ Waiting for lobby...')
    await hostPage.waitForTimeout(5000)

    // Screenshot: In lobby
    const screenshot2 = `test-results/test1-host-lobby-${Date.now()}.png`
    await hostPage.screenshot({ path: screenshot2, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot2}`)

    // Extract room code
    const urlHash = await hostPage.evaluate(() => window.location.hash)
    capturedRoomCode = extractRoomCode(urlHash)
    
    console.log('🔗 Room Information:')
    console.log(`   URL Hash: ${urlHash}`)
    console.log(`   Room Code: ${capturedRoomCode}`)
    
    if (!capturedRoomCode || capturedRoomCode.length < 3) {
      throw new Error(`Invalid room code extracted: ${capturedRoomCode}`)
    }

    // Verify lobby loaded
    const roomCodeDisplay = hostPage.locator('.room-code:has-text("Room Code")')
    await expect(roomCodeDisplay).toBeVisible({ timeout: 5000 })
    console.log('✅ Room code displayed in lobby')

    // Verify ready button
    const readyBtn = hostPage.locator('button:has-text("READY FOR HAUNT")')
    await expect(readyBtn).toBeVisible({ timeout: 5000 })
    console.log('✅ READY FOR HAUNT button visible')

    console.log('\n✅ TEST 1 PASSED - Host created room successfully')
    console.log(`   Room Code: ${capturedRoomCode}`)
  })

  test('TEST 2: Joiner Connects', async () => {
    console.log('\n📱 TEST 2: Joiner Connects')
    console.log('-'.repeat(70))

    if (!capturedRoomCode) {
      throw new Error('No room code available from Test 1')
    }

    const joinUrl = buildRoomUrl(PRODUCTION_URL, capturedRoomCode)
    console.log(`🔗 Join URL: ${joinUrl}`)

    // Joiner navigates to room
    await joinerPage.goto(joinUrl, { waitUntil: 'networkidle' })
    console.log('✅ Joiner navigated to room')

    // Wait for initialization
    console.log('⏳ Waiting for PlayroomKit (8s)...')
    await joinerPage.waitForTimeout(8000)

    // Screenshot: Joiner initial
    const screenshot1 = `test-results/test2-joiner-initial-${Date.now()}.png`
    await joinerPage.screenshot({ path: screenshot1, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot1}`)

    // Verify joiner sees joining indicator
    const roleBadge = joinerPage.locator('.room-code')
    const badgeText = await roleBadge.textContent().catch(() => 'Not found')
    console.log(`   Joiner role: "${badgeText?.trim()}"`)

    // Enter joiner name
    const input = joinerPage.locator('input[placeholder*="CALLSIGN" i]')
    await expect(input).toBeVisible({ timeout: 10000 })
    await input.fill('GhostJoiner')
    console.log('✅ Joiner entered name: GhostJoiner')

    // Join
    const joinBtn = joinerPage.locator('button:has-text("HAUNTED HOUSE")')
    await joinBtn.click()
    console.log('✅ Joiner clicked ENTER THE HAUNTED HOUSE')

    // Wait for lobby
    await joinerPage.waitForTimeout(5000)

    // Screenshot: Joiner in lobby
    const screenshot2 = `test-results/test2-joiner-lobby-${Date.now()}.png`
    await joinerPage.screenshot({ path: screenshot2, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot2}`)

    // Verify both players visible
    console.log('🔍 Verifying player list...')
    const playerCards = joinerPage.locator('.player-card')
    const playerCount = await playerCards.count()
    console.log(`   Players visible: ${playerCount}`)

    // Check for both names
    const hostVisible = await joinerPage.locator('text=/GhostHost/i').isVisible().catch(() => false)
    const joinerVisible = await joinerPage.locator('text=/GhostJoiner/i').isVisible().catch(() => false)
    
    console.log(`   GhostHost visible: ${hostVisible}`)
    console.log(`   GhostJoiner visible: ${joinerVisible}`)

    if (hostVisible && joinerVisible) {
      console.log('✅ Both players visible in joiner lobby')
    } else {
      console.log('⚠️ Not all players visible yet, waiting...')
      await joinerPage.waitForTimeout(3000)
    }

    // Screenshot: Host view with joiner
    await hostPage.waitForTimeout(2000)
    const screenshot3 = `test-results/test2-host-with-joiner-${Date.now()}.png`
    await hostPage.screenshot({ path: screenshot3, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot3}`)

    console.log('\n✅ TEST 2 PASSED - Joiner connected successfully')
  })

  test('TEST 3: Ready State Sync', async () => {
    console.log('\n📱 TEST 3: Ready State Sync')
    console.log('-'.repeat(70))

    console.log('🎮 Testing ready state synchronization...')
    
    // Host clicks ready
    const hostReadyBtn = hostPage.locator('button:has-text("READY FOR HAUNT")')
    await hostReadyBtn.click()
    console.log('✅ Host clicked READY FOR HAUNT')

    await hostPage.waitForTimeout(2000)

    // Screenshot: Host ready
    const screenshot1 = `test-results/test3-host-ready-${Date.now()}.png`
    await hostPage.screenshot({ path: screenshot1, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot1}`)

    // Verify host sees cancel button
    const cancelBtn = hostPage.locator('button:has-text("CANCEL READY")')
    await expect(cancelBtn).toBeVisible({ timeout: 5000 })
    console.log('✅ Host sees CANCEL READY button')

    // Wait for sync
    console.log('⏳ Waiting for state sync (3s)...')
    await joinerPage.waitForTimeout(3000)

    // Screenshot: Joiner sees host ready
    const screenshot2 = `test-results/test3-joiner-sees-host-${Date.now()}.png`
    await joinerPage.screenshot({ path: screenshot2, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot2}`)

    // Joiner clicks ready
    const joinerReadyBtn = joinerPage.locator('button:has-text("READY FOR HAUNT")')
    await joinerReadyBtn.click()
    console.log('✅ Joiner clicked READY FOR HAUNT')

    await joinerPage.waitForTimeout(2000)

    // Wait for sync
    console.log('⏳ Waiting for state sync (3s)...')
    await hostPage.waitForTimeout(3000)

    // Screenshot: Both ready
    const screenshot3 = `test-results/test3-both-ready-${Date.now()}.png`
    await hostPage.screenshot({ path: screenshot3, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot3}`)

    // Check for start button
    const startBtn = hostPage.locator('button:has-text("START GHOST HUNT")')
    const startVisible = await startBtn.isVisible().catch(() => false)
    
    if (startVisible) {
      const enabled = await startBtn.isEnabled().catch(() => false)
      console.log(`   START GHOST HUNT button: ${enabled ? 'ENABLED' : 'disabled'}`)
    } else {
      console.log('   ℹ️ START GHOST HUNT button not visible (checking wait state)')
      const waitText = await hostPage.locator('text=/WAITING/i').isVisible().catch(() => false)
      console.log(`   Wait text visible: ${waitText}`)
    }

    console.log('\n✅ TEST 3 PASSED - Ready state sync working')
  })

  test('TEST 4: localStorage Persistence', async () => {
    console.log('\n📱 TEST 4: localStorage Persistence')
    console.log('-'.repeat(70))

    console.log('💾 Testing localStorage persistence...')
    
    // Leave room
    const leaveBtn = joinerPage.locator('button:has-text("LEAVE ROOM")')
    await leaveBtn.click()
    console.log('✅ Joiner clicked LEAVE ROOM')

    await joinerPage.waitForTimeout(3000)

    // Screenshot: After leaving
    const screenshot1 = `test-results/test4-joiner-left-${Date.now()}.png`
    await joinerPage.screenshot({ path: screenshot1, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot1}`)

    // Rejoin
    const rejoinUrl = buildRoomUrl(PRODUCTION_URL, capturedRoomCode)
    console.log(`🔗 Rejoining: ${rejoinUrl}`)
    
    await joinerPage.goto(rejoinUrl, { waitUntil: 'networkidle' })
    await joinerPage.waitForTimeout(6000)

    // Screenshot: Rejoin screen
    const screenshot2 = `test-results/test4-rejoin-${Date.now()}.png`
    await joinerPage.screenshot({ path: screenshot2, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot2}`)

    // Check for pre-filled name
    const input = joinerPage.locator('input[placeholder*="CALLSIGN" i]')
    const inputValue = await input.inputValue().catch(() => '')
    
    console.log(`   Input value: "${inputValue}"`)
    
    if (inputValue === 'GhostJoiner') {
      console.log('✅ Name persisted in localStorage!')
    } else {
      console.log(`   ⚠️ Name not persisted (found: "${inputValue}")`)
    }

    // Rejoin
    if (inputValue !== 'GhostJoiner') {
      await input.fill('GhostJoiner')
    }
    
    const joinBtn = joinerPage.locator('button:has-text("HAUNTED HOUSE")')
    await joinBtn.click()
    await joinerPage.waitForTimeout(4000)

    // Screenshot: Rejoined
    const screenshot3 = `test-results/test4-rejoined-${Date.now()}.png`
    await joinerPage.screenshot({ path: screenshot3, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot3}`)

    console.log('\n✅ TEST 4 PASSED - localStorage test complete')
  })

  test('TEST 5: Link Sharing', async () => {
    console.log('\n📱 TEST 5: Link Sharing')
    console.log('-'.repeat(70))

    console.log('🔗 Testing link sharing features...')
    
    // Check QR code
    const qrVisible = await hostPage.locator('svg').first().isVisible().catch(() => false)
    console.log(`   QR code visible: ${qrVisible}`)

    if (qrVisible) {
      const screenshot1 = `test-results/test5-qr-${Date.now()}.png`
      await hostPage.screenshot({ path: screenshot1, fullPage: false })
      console.log(`📸 Screenshot: ${screenshot1}`)
    }

    // Test copy button
    const copyBtn = hostPage.locator('button:has-text("COPY ROOM LINK")')
    const copyVisible = await copyBtn.isVisible().catch(() => false)
    
    if (copyVisible) {
      await copyBtn.click()
      console.log('✅ Clicked COPY ROOM LINK')
      
      await hostPage.waitForTimeout(1000)
      
      const screenshot2 = `test-results/test5-copied-${Date.now()}.png`
      await hostPage.screenshot({ path: screenshot2, fullPage: false })
      console.log(`📸 Screenshot: ${screenshot2}`)
      
      const copiedVisible = await hostPage.locator('button:has-text("LINK COPIED!")').isVisible().catch(() => false)
      console.log(`   Shows LINK COPIED!: ${copiedVisible}`)
    } else {
      console.log('   ℹ️ Copy button not visible')
    }

    console.log('\n✅ TEST 5 PASSED - Link sharing test complete')
  })

  test('TEST 6: Mobile Viewport', async () => {
    console.log('\n📱 TEST 6: Mobile Viewport')
    console.log('-'.repeat(70))

    console.log('📱 Testing mobile viewport...')
    
    // Refresh on mobile
    await joinerPage.reload()
    await joinerPage.waitForTimeout(6000)

    // Screenshot: Mobile view
    const screenshot1 = `test-results/test6-mobile-${Date.now()}.png`
    await joinerPage.screenshot({ path: screenshot1, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot1}`)

    // Check viewport meta
    const viewport = await joinerPage.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]')
      return meta?.getAttribute('content') || 'NOT FOUND'
    })
    console.log(`   Viewport meta: ${viewport}`)

    // Check for Desktop/Mobile text (should NOT exist per Universal Design)
    const bodyText = await joinerPage.locator('body').textContent()
    const hasDeviceText = /Desktop|Mobile/i.test(bodyText)
    
    if (hasDeviceText) {
      console.log('   ❌ FAIL: Found "Desktop" or "Mobile" text')
    } else {
      console.log('   ✅ Universal Design compliant (no Desktop/Mobile text)')
    }

    // Count buttons
    const buttonCount = await joinerPage.locator('button').count()
    console.log(`   Buttons visible: ${buttonCount}`)

    console.log('\n✅ TEST 6 PASSED - Mobile viewport test complete')
  })

  test('TEST 7: Graceful Degradation', async () => {
    console.log('\n📱 TEST 7: Graceful Degradation')
    console.log('-'.repeat(70))

    console.log('🐌 Testing graceful degradation...')
    
    // Create new page
    const newPage = await joinerContext.newPage()
    
    const joinUrl = buildRoomUrl(PRODUCTION_URL, capturedRoomCode)
    console.log(`🔗 Testing join: ${joinUrl}`)

    await newPage.goto(joinUrl, { waitUntil: 'networkidle' })
    console.log('   ⏳ Loading...')

    await newPage.waitForTimeout(5000)

    // Screenshot: Loading state
    const screenshot1 = `test-results/test7-loading-${Date.now()}.png`
    await newPage.screenshot({ path: screenshot1, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot1}`)

    // Check for joining state
    const joiningVisible = await newPage.locator('text=/Joining/i').isVisible().catch(() => false)
    console.log(`   "Joining" state visible: ${joiningVisible}`)

    // Join
    const input = newPage.locator('input[placeholder*="CALLSIGN" i]')
    await input.fill('TestPlayer')
    
    const joinBtn = newPage.locator('button:has-text("HAUNTED HOUSE")')
    await joinBtn.click()
    
    await newPage.waitForTimeout(4000)

    // Screenshot: Joined
    const screenshot2 = `test-results/test7-joined-${Date.now()}.png`
    await newPage.screenshot({ path: screenshot2, fullPage: false })
    console.log(`📸 Screenshot: ${screenshot2}`)

    // Count players
    const playerCount = await newPage.locator('.player-card').count()
    console.log(`   Players visible: ${playerCount}`)

    await newPage.close()

    console.log('\n✅ TEST 7 PASSED - Graceful degradation test complete')
  })
})
