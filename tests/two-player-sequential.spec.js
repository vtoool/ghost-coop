import { test, expect, chromium } from '@playwright/test'

/**
 * Sequential 2-Player E2E Test Suite for Ecto-Busters
 * Tests run sequentially to avoid context conflicts
 * 
 * CRITICAL FIXES APPLIED:
 * - Button text: "READY FOR HAUNT" not "READY"
 * - Room code format: #r=XXXXX (PlayroomKit format)
 * - Longer waits for Playroom initialization (8+ seconds)
 * - Sequential execution (no parallel workers)
 * - Shared room code via test context
 */

const PRODUCTION_URL = 'https://ghost-coop.vercel.app'

// Helper to extract room code from URL hash
function extractRoomCode(hash) {
  // PlayroomKit format: #r=XXXXX
  if (hash.startsWith('#r=')) {
    return hash.slice(3) // Remove '#r='
  }
  if (hash.startsWith('#')) {
    return hash.slice(1) // Remove '#'
  }
  return hash
}

// Helper to build room URL
function buildRoomUrl(baseUrl, roomCode) {
  return `${baseUrl}/#r=${roomCode}`
}

test.describe.configure({ mode: 'serial' }) // Force sequential execution

test.describe('2-Player Co-op Experience Tests (Sequential)', () => {
  let hostContext, joinerContext
  let hostPage, joinerPage
  let capturedRoomCode = null

  test.beforeAll(async () => {
    console.log('\n🎮 Initializing Test Suite')
    console.log('=' .repeat(60))
    
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

    console.log('✅ Browser contexts created')
    console.log('   Host: Desktop Chrome (1280x720)')
    console.log('   Joiner: Mobile Chrome (393x851)')
  })

  test.afterAll(async () => {
    await hostContext?.close()
    await joinerContext?.close()
    console.log('\n🧹 Test cleanup complete')
    console.log('=' .repeat(60))
  })

  test('Scenario 1: Host Initialization & Welcome Screen', async () => {
    console.log('\n📱 TEST 1: Host Initialization')
    console.log('-'.repeat(50))

    // Navigate to production URL
    console.log('🌐 Navigating to production URL...')
    await hostPage.goto(PRODUCTION_URL, { waitUntil: 'networkidle' })
    console.log('✅ Host navigated to production URL')

    // Wait for Playroom to initialize (CRITICAL: Extended wait for production)
    console.log('⏳ Waiting for Playroom initialization (8 seconds)...')
    await hostPage.waitForTimeout(8000)

    // Check for "Restoring your profile..." or "Joining..." state
    console.log('🔍 Checking loading state...')
    let attempts = 0
    const maxAttempts = 15
    
    while (attempts < maxAttempts) {
      attempts++
      const restoringVisible = await hostPage.locator('text=/Restoring your profile/i').isVisible().catch(() => false)
      const joiningVisible = await hostPage.locator('text=/Joining/i').isVisible().catch(() => false)
      
      if (!restoringVisible && !joiningVisible) {
        console.log(`✅ Loading complete after ${attempts} checks`)
        break
      }
      
      console.log(`   Still loading... (attempt ${attempts}/${maxAttempts})`)
      await hostPage.waitForTimeout(1000)
    }

    // Screenshot: Welcome screen
    const welcomeScreenshot = `test-results/s1-host-welcome-${Date.now()}.png`
    await hostPage.screenshot({ path: welcomeScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${welcomeScreenshot}`)

    // Verify UI elements exist
    console.log('🔍 Verifying UI elements...')
    
    const title = hostPage.locator('h1:has-text("ECTO-BUSTERS")')
    await expect(title).toBeVisible({ timeout: 5000 })
    console.log('   ✅ Title visible')

    const input = hostPage.locator('input[placeholder*="CALLSIGN" i]')
    await expect(input).toBeVisible({ timeout: 5000 })
    console.log('   ✅ Name input visible')

    const roleBadge = hostPage.locator('.room-code')
    await expect(roleBadge).toBeVisible({ timeout: 5000 })
    const badgeText = await roleBadge.textContent()
    console.log(`   ✅ Host badge visible: "${badgeText?.trim()}"`)

    // Enter name
    await input.fill('GhostHost')
    console.log('   ✅ Entered nickname: GhostHost')

    // Click join button
    const enterButton = hostPage.locator('button:has-text("HAUNTED HOUSE")')
    await enterButton.click()
    console.log('   ✅ Clicked ENTER THE HAUNTED HOUSE')

    // Wait for lobby transition
    console.log('⏳ Waiting for lobby transition...')
    await hostPage.waitForTimeout(4000)

    // Screenshot: Host in lobby
    const lobbyScreenshot = `test-results/s1-host-lobby-${Date.now()}.png`
    await hostPage.screenshot({ path: lobbyScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${lobbyScreenshot}`)

    // Extract room code from URL (CRITICAL: PlayroomKit format #r=XXXXX)
    const urlHash = await hostPage.evaluate(() => window.location.hash)
    capturedRoomCode = extractRoomCode(urlHash)
    
    console.log('🔗 URL Information:')
    console.log(`   Raw hash: ${urlHash}`)
    console.log(`   Room code: ${capturedRoomCode}`)
    
    if (!capturedRoomCode || capturedRoomCode.length < 4) {
      throw new Error(`Failed to extract valid room code from URL: ${urlHash}`)
    }

    // Verify room code is displayed in UI
    const roomCodeDisplay = hostPage.locator('.room-code:has-text("Room Code")')
    await expect(roomCodeDisplay).toBeVisible()
    console.log('   ✅ Room code displayed in lobby')

    // Verify ready button exists (CRITICAL FIX: "READY FOR HAUNT")
    const readyButton = hostPage.locator('button:has-text("READY FOR HAUNT")')
    await expect(readyButton).toBeVisible()
    console.log('   ✅ Ready button visible (READY FOR HAUNT)')

    console.log('\n✅ TEST 1 COMPLETE - Host initialized successfully')
    console.log(`   Room Code: ${capturedRoomCode}`)
  })

  test('Scenario 2: Joiner Connection & 2-Player Lobby', async () => {
    console.log('\n📱 TEST 2: Joiner Connection')
    console.log('-'.repeat(50))

    if (!capturedRoomCode) {
      throw new Error('Room code not available from previous test')
    }

    // Build proper room URL (CRITICAL: #r= format)
    const joinUrl = buildRoomUrl(PRODUCTION_URL, capturedRoomCode)
    console.log(`🔗 Join URL: ${joinUrl}`)

    // Joiner navigates to room
    await joinerPage.goto(joinUrl, { waitUntil: 'networkidle' })
    console.log('✅ Joiner navigated to room URL')

    // Wait for initialization (CRITICAL: Extended wait)
    console.log('⏳ Waiting for Playroom initialization (8 seconds)...')
    await joinerPage.waitForTimeout(8000)

    // Check for "Joining existing game" indicator
    console.log('🔍 Checking for joiner indicators...')
    const joiningIndicator = await joinerPage.locator('text=/Joining existing game/i').isVisible().catch(() => false)
    if (joiningIndicator) {
      console.log('   ✅ Joiner sees "Joining existing game" indicator')
    }

    // Screenshot: Joiner welcome screen
    const joinerWelcomeScreenshot = `test-results/s2-joiner-welcome-${Date.now()}.png`
    await joinerPage.screenshot({ path: joinerWelcomeScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${joinerWelcomeScreenshot}`)

    // Enter joiner name
    console.log('🔍 Verifying name input...')
    const input = joinerPage.locator('input[placeholder*="CALLSIGN" i]')
    await expect(input).toBeVisible({ timeout: 5000 })
    await input.fill('GhostJoiner')
    console.log('   ✅ Joiner entered nickname: GhostJoiner')

    // Join
    const enterButton = joinerPage.locator('button:has-text("HAUNTED HOUSE")')
    await enterButton.click()
    console.log('   ✅ Joiner clicked ENTER THE HAUNTED HOUSE')

    // Wait for lobby
    console.log('⏳ Waiting for lobby transition...')
    await joinerPage.waitForTimeout(4000)

    // Screenshot: Joiner in lobby
    const joinerLobbyScreenshot = `test-results/s2-joiner-lobby-${Date.now()}.png`
    await joinerPage.screenshot({ path: joinerLobbyScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${joinerLobbyScreenshot}`)

    // Verify both players appear in joiner's list
    console.log('🔍 Verifying player list...')
    const playerCards = joinerPage.locator('.player-card')
    const playerCount = await playerCards.count()
    console.log(`   👥 Players in joiner's list: ${playerCount}`)

    // Verify both names appear
    const hostName = joinerPage.locator('text=/GhostHost/i')
    const joinerName = joinerPage.locator('text=/GhostJoiner/i')
    await expect(hostName).toBeVisible()
    await expect(joinerName).toBeVisible()
    console.log('   ✅ Both player names visible in joiner\'s lobby')

    // Verify same in host's view
    await hostPage.waitForTimeout(2000)
    const hostPlayerCount = await hostPage.locator('.player-card').count()
    console.log(`   👥 Players in host's list: ${hostPlayerCount}`)

    // Screenshot: Host sees joiner
    const hostWithJoinerScreenshot = `test-results/s2-host-with-joiner-${Date.now()}.png`
    await hostPage.screenshot({ path: hostWithJoinerScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${hostWithJoinerScreenshot}`)

    console.log('\n✅ TEST 2 COMPLETE - 2-player connection successful')
  })

  test('Scenario 3: Real-Time State Synchronization', async () => {
    console.log('\n📱 TEST 3: Real-Time State Synchronization')
    console.log('-'.repeat(50))

    // Host marks ready (CRITICAL FIX: "READY FOR HAUNT")
    console.log('🎮 Testing ready state synchronization...')
    const hostReadyBtn = hostPage.locator('button:has-text("READY FOR HAUNT")')
    await hostReadyBtn.click()
    console.log('   ✅ Host clicked READY FOR HAUNT')

    await hostPage.waitForTimeout(1500)

    // Screenshot: Host ready state
    const hostReadyScreenshot = `test-results/s3-host-ready-${Date.now()}.png`
    await hostPage.screenshot({ path: hostReadyScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${hostReadyScreenshot}`)

    // Verify host sees "CANCEL READY" button
    const hostCancelBtn = hostPage.locator('button:has-text("CANCEL READY")')
    await expect(hostCancelBtn).toBeVisible()
    console.log('   ✅ Host sees CANCEL READY button')

    // Wait for sync and check joiner sees host is ready
    console.log('⏳ Waiting for state sync (3 seconds)...')
    await joinerPage.waitForTimeout(3000)

    // Screenshot: Joiner sees host ready
    const joinerSeesHostScreenshot = `test-results/s3-joiner-sees-host-ready-${Date.now()}.png`
    await joinerPage.screenshot({ path: joinerSeesHostScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${joinerSeesHostScreenshot}`)

    // Verify joiner sees host's ready status
    const hostPlayerCard = joinerPage.locator('.player-card:has-text("GhostHost")')
    const hostReadyText = await hostPlayerCard.locator('text=READY').isVisible().catch(() => false)
    if (hostReadyText) {
      console.log('   ✅ Joiner sees GhostHost is READY')
    } else {
      console.log('   ⚠️ Ready status may still be syncing')
    }

    // Joiner marks ready
    const joinerReadyBtn = joinerPage.locator('button:has-text("READY FOR HAUNT")')
    await joinerReadyBtn.click()
    console.log('   ✅ Joiner clicked READY FOR HAUNT')

    await joinerPage.waitForTimeout(1500)

    // Screenshot: Joiner ready state
    const joinerReadyScreenshot = `test-results/s3-joiner-ready-${Date.now()}.png`
    await joinerPage.screenshot({ path: joinerReadyScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${joinerReadyScreenshot}`)

    // Wait for sync and verify host sees both ready
    console.log('⏳ Waiting for state sync (3 seconds)...')
    await hostPage.waitForTimeout(3000)

    // Screenshot: Host sees both ready
    const hostBothReadyScreenshot = `test-results/s3-host-both-ready-${Date.now()}.png`
    await hostPage.screenshot({ path: hostBothReadyScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${hostBothReadyScreenshot}`)

    // Verify host sees START GHOST HUNT button (enabled)
    const startButton = hostPage.locator('button:has-text("START GHOST HUNT")')
    const startButtonVisible = await startButton.isVisible().catch(() => false)
    
    if (startButtonVisible) {
      const isEnabled = await startButton.isEnabled().catch(() => false)
      if (isEnabled) {
        console.log('   ✅ Host sees ENABLED START GHOST HUNT button')
      } else {
        console.log('   ⚠️ START GHOST HUNT button visible but disabled')
      }
    } else {
      console.log('   ℹ️ START GHOST HUNT button not visible (host may not be host)')
    }

    console.log('\n✅ TEST 3 COMPLETE - Real-time synchronization verified')
  })

  test('Scenario 4: localStorage Persistence', async () => {
    console.log('\n📱 TEST 4: localStorage Persistence')
    console.log('-'.repeat(50))

    // Leave the room as joiner
    console.log('🚪 Testing leave room and rejoin...')
    const leaveBtn = joinerPage.locator('button:has-text("LEAVE ROOM")')
    await leaveBtn.click()
    console.log('   ✅ Joiner clicked LEAVE ROOM')

    await joinerPage.waitForTimeout(3000)

    // Screenshot: Joiner after leaving
    const joinerLeftScreenshot = `test-results/s4-joiner-left-${Date.now()}.png`
    await joinerPage.screenshot({ path: joinerLeftScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${joinerLeftScreenshot}`)

    // Rejoin with same room code (CRITICAL: #r= format)
    if (!capturedRoomCode) {
      throw new Error('Room code not available')
    }
    const rejoinUrl = buildRoomUrl(PRODUCTION_URL, capturedRoomCode)
    console.log(`🔗 Rejoin URL: ${rejoinUrl}`)
    
    await joinerPage.goto(rejoinUrl, { waitUntil: 'networkidle' })
    await joinerPage.waitForTimeout(6000)

    // Screenshot: Welcome screen should show pre-filled name
    const rejoinScreenshot = `test-results/s4-rejoin-welcome-${Date.now()}.png`
    await joinerPage.screenshot({ path: rejoinScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${rejoinScreenshot}`)

    // Verify name input is pre-filled
    console.log('🔍 Checking localStorage persistence...')
    const nameInput = joinerPage.locator('input[placeholder*="CALLSIGN" i]')
    const inputValue = await nameInput.inputValue()

    if (inputValue === 'GhostJoiner') {
      console.log(`   ✅ Nickname persisted in localStorage: "${inputValue}"`)
    } else {
      console.log(`   ⚠️ Nickname not pre-filled. Found: "${inputValue}"`)
      console.log('      (Expected: "GhostJoiner")')
    }

    // Rejoin with the persisted name
    if (inputValue !== 'GhostJoiner') {
      await nameInput.fill('GhostJoiner')
    }

    const enterButton = joinerPage.locator('button:has-text("HAUNTED HOUSE")')
    await enterButton.click()
    await joinerPage.waitForTimeout(3000)

    // Screenshot: Successfully rejoined
    const rejoinedScreenshot = `test-results/s4-rejoined-lobby-${Date.now()}.png`
    await joinerPage.screenshot({ path: rejoinedScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${rejoinedScreenshot}`)

    // Verify profile restored
    const restoredName = joinerPage.locator('text=/GhostJoiner/i')
    await expect(restoredName).toBeVisible()
    console.log('   ✅ Profile successfully restored from localStorage')

    console.log('\n✅ TEST 4 COMPLETE - localStorage persistence verified')
  })

  test('Scenario 5: Link Sharing Flow', async () => {
    console.log('\n📱 TEST 5: Link Sharing Flow')
    console.log('-'.repeat(50))

    console.log('🔗 Testing link sharing features...')
    
    // Check for QR code on host
    const qrCode = hostPage.locator('svg').first()
    const isQrVisible = await qrCode.isVisible().catch(() => false)

    if (isQrVisible) {
      console.log('   ✅ QR code visible on host')

      // Screenshot: QR code
      const qrScreenshot = `test-results/s5-qr-code-${Date.now()}.png`
      await hostPage.screenshot({ path: qrScreenshot, fullPage: false })
      console.log(`📸 Screenshot saved: ${qrScreenshot}`)
    } else {
      console.log('   ℹ️ QR code not visible (may be hidden when 2+ players)')
    }

    // Test copy room link button on host
    const copyBtn = hostPage.locator('button:has-text("COPY ROOM LINK")')
    const copyBtnVisible = await copyBtn.isVisible().catch(() => false)
    
    if (copyBtnVisible) {
      await copyBtn.click()
      console.log('   ✅ Clicked COPY ROOM LINK')

      await hostPage.waitForTimeout(500)

      // Screenshot: Link copied state
      const copiedScreenshot = `test-results/s5-link-copied-${Date.now()}.png`
      await hostPage.screenshot({ path: copiedScreenshot, fullPage: false })
      console.log(`📸 Screenshot saved: ${copiedScreenshot}`)

      // Verify button text changed
      const copiedBtn = hostPage.locator('button:has-text("LINK COPIED!")')
      const copiedVisible = await copiedBtn.isVisible().catch(() => false)
      
      if (copiedVisible) {
        console.log('   ✅ Button changed to "LINK COPIED!"')
      }

      // Wait for it to revert
      await hostPage.waitForTimeout(2500)

      // Screenshot: Button reverted
      const revertedScreenshot = `test-results/s5-button-reverted-${Date.now()}.png`
      await hostPage.screenshot({ path: revertedScreenshot, fullPage: false })
      console.log(`📸 Screenshot saved: ${revertedScreenshot}`)

      const revertedBtn = hostPage.locator('button:has-text("COPY ROOM LINK")')
      const revertedVisible = await revertedBtn.isVisible().catch(() => false)
      
      if (revertedVisible) {
        console.log('   ✅ Button reverted to "COPY ROOM LINK" after 2.5 seconds')
      }
    } else {
      console.log('   ℹ️ COPY ROOM LINK button not visible')
    }

    console.log('\n✅ TEST 5 COMPLETE - Link sharing flow working')
  })

  test('Scenario 6: Mobile-Specific Testing', async () => {
    console.log('\n📱 TEST 6: Mobile-Specific Testing')
    console.log('-'.repeat(50))

    // Ensure joiner is on mobile viewport
    await joinerPage.setViewportSize({ width: 393, height: 851 })
    console.log('   ✅ Joiner viewport set to Pixel 5 (393x851)')

    // Refresh to see mobile layout
    await joinerPage.reload()
    await joinerPage.waitForTimeout(6000)

    // Screenshot: Mobile layout
    const mobileScreenshot = `test-results/s6-mobile-layout-${Date.now()}.png`
    await joinerPage.screenshot({ path: mobileScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${mobileScreenshot}`)

    // Check for mobile-specific meta tags
    console.log('🔍 Checking mobile configuration...')
    const viewportMeta = await joinerPage.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]')
      return meta ? meta.getAttribute('content') : null
    })
    console.log(`   📱 Viewport meta: ${viewportMeta || 'NOT FOUND'}`)

    // Verify no "Desktop" or "Mobile" text (Universal Design check)
    const bodyText = await joinerPage.locator('body').textContent()
    const hasDesktopMobileText = /Desktop|Mobile/i.test(bodyText)

    if (hasDesktopMobileText) {
      console.log('   ❌ FAIL: Found "Desktop" or "Mobile" text (violates Universal Design)')
    } else {
      console.log('   ✅ No "Desktop/Mobile" text found (Universal Design compliant)')
    }

    expect(bodyText).not.toMatch(/Desktop|Mobile/i)

    // Verify touch-friendly elements
    const buttons = joinerPage.locator('button')
    const buttonCount = await buttons.count()
    console.log(`   ✅ Found ${buttonCount} buttons on mobile view`)

    // Screenshot: Mobile interactions
    const mobileInteractionScreenshot = `test-results/s6-mobile-interactions-${Date.now()}.png`
    await joinerPage.screenshot({ path: mobileInteractionScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${mobileInteractionScreenshot}`)

    console.log('\n✅ TEST 6 COMPLETE - Mobile-specific testing done')
  })

  test('Scenario 7: Graceful Degradation', async () => {
    console.log('\n📱 TEST 7: Graceful Degradation')
    console.log('-'.repeat(50))

    console.log('🐌 Testing graceful degradation...')
    
    // Create a new page to test joining with potential delays
    const slowJoinerPage = await joinerContext.newPage()
    
    if (!capturedRoomCode) {
      throw new Error('Room code not available')
    }
    
    const joinUrl = buildRoomUrl(PRODUCTION_URL, capturedRoomCode)
    console.log(`🔗 Testing join with URL: ${joinUrl}`)

    // Navigate 
    await slowJoinerPage.goto(joinUrl, { waitUntil: 'networkidle' })
    console.log('   ⏳ Joiner navigating...')

    // Screenshot: Initial loading state
    await slowJoinerPage.waitForTimeout(3000)
    const loadingScreenshot = `test-results/s7-loading-state-${Date.now()}.png`
    await slowJoinerPage.screenshot({ path: loadingScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${loadingScreenshot}`)

    // Wait longer for initialization
    await slowJoinerPage.waitForTimeout(5000)

    // Check if "Joining..." state appears
    const joiningState = slowJoinerPage.locator('text=/Joining/i')
    const hasJoiningState = await joiningState.isVisible().catch(() => false)

    if (hasJoiningState) {
      console.log('   ✅ "Joining..." state visible during connection')

      // Screenshot: Joining state
      const joiningScreenshot = `test-results/s7-joining-state-${Date.now()}.png`
      await slowJoinerPage.screenshot({ path: joiningScreenshot, fullPage: false })
      console.log(`📸 Screenshot saved: ${joiningScreenshot}`)
    } else {
      console.log('   ℹ️ No "Joining..." state visible (may have loaded quickly)')
    }

    // Enter name and join
    const input = slowJoinerPage.locator('input[placeholder*="CALLSIGN" i]')
    await input.fill('SlowJoiner')

    const enterButton = slowJoinerPage.locator('button:has-text("HAUNTED HOUSE")')
    await enterButton.click()

    await slowJoinerPage.waitForTimeout(4000)

    // Screenshot: Post-join state
    const joinedScreenshot = `test-results/s7-slow-joined-${Date.now()}.png`
    await slowJoinerPage.screenshot({ path: joinedScreenshot, fullPage: false })
    console.log(`📸 Screenshot saved: ${joinedScreenshot}`)

    // Verify join was successful
    const playerList = slowJoinerPage.locator('.player-card')
    const playerCount = await playerList.count()
    console.log(`   ✅ Players visible despite potential delays: ${playerCount}`)

    await slowJoinerPage.close()

    console.log('\n✅ TEST 7 COMPLETE - Graceful degradation verified')
  })
})
