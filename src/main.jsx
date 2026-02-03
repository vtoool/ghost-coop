import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { insertCoin, myPlayer, isHost } from 'playroomkit'
import './index.css'
import App from './App.jsx'
import { getStoredProfile } from './utils/playerStorage.js'

/**
 * NETWORK GATE PATTERN - Phase 1 Stability Fix
 * 
 * The Gatekeeper ensures Playroom is 100% ready before React renders.
 * This eliminates race conditions between React StrictMode and Playroom initialization.
 * 
 * Rules:
 * 1. insertCoin() happens OUTSIDE React
 * 2. Wait for myPlayer().id to exist (confirms player object is ready)
 * 3. Only then createRoot and render
 * 4. All UI components assume network is ready
 */

const MAX_WAIT_TIME = 15000 // 15 seconds max wait
const CHECK_INTERVAL = 100  // Check every 100ms

async function waitForPlayerObject() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const checkPlayer = () => {
      try {
        const player = myPlayer()
        
        // Verify player object exists AND has an id
        if (player && player.id) {
          console.log('[Gatekeeper] Player object confirmed:', player.id)
          resolve(player)
          return
        }
        
        // Check timeout
        if (Date.now() - startTime > MAX_WAIT_TIME) {
          reject(new Error('Timeout waiting for player object'))
          return
        }
        
        // Check again
        setTimeout(checkPlayer, CHECK_INTERVAL)
      } catch (error) {
        // Check timeout
        if (Date.now() - startTime > MAX_WAIT_TIME) {
          reject(new Error('Timeout waiting for player object: ' + error.message))
          return
        }
        
        // Retry on error
        setTimeout(checkPlayer, CHECK_INTERVAL)
      }
    }
    
    checkPlayer()
  })
}

async function bootstrap() {
  console.log('[Gatekeeper] Starting Network Gate...')
  
  try {
    // Step 1: Initialize Playroom (this creates the room and WebRTC connection)
    console.log('[Gatekeeper] Initializing Playroom...')
    await insertCoin({
      skipLobby: true,
      streamMode: true,
    })
    
    // Step 2: Wait for player object to be fully ready
    // This is CRITICAL - insertCoin resolves before myPlayer() is fully populated
    console.log('[Gatekeeper] Waiting for player object...')
    const player = await waitForPlayerObject()
    
    // Step 3: Verify host status is available
    const hostStatus = isHost()
    console.log('[Gatekeeper] Connection confirmed:', {
      playerId: player.id,
      isHost: hostStatus,
      timestamp: new Date().toISOString()
    })
    
    // Step 4: Restore profile from localStorage if exists (Fixes "Amnesia" Bug)
    const storedProfile = getStoredProfile()
    if (storedProfile?.name) {
      console.log('[Gatekeeper] Restoring profile from localStorage:', storedProfile.name)
      player.setState('profile', storedProfile, true) // true = reliable
      player.setState('ready', false, true)
      console.log('[Gatekeeper] Profile restored successfully')
    }
    
    // Step 5: NOW it's safe to render React
    console.log('[Gatekeeper] Network gate open - rendering React...')
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    
    console.log('[Gatekeeper] React rendered successfully')
    
  } catch (error) {
    console.error('[Gatekeeper] Failed to initialize:', error)
    
    // Show user-friendly error
    const root = document.getElementById('root')
    if (root) {
      root.innerHTML = `
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          color: white;
          font-family: 'JetBrains Mono', monospace;
          text-align: center;
          padding: 20px;
          background: #050505;
        ">
          <div>
            <h1 style="color: #ff4444; margin-bottom: 16px; font-family: 'JetBrains Mono', monospace;">Connection Error</h1>
            <p style="color: #F0F0F0; margin-bottom: 8px;">Failed to connect to the spectral plane.</p>
            <p style="color: #888; font-size: 14px; margin-top: 8px;">${error.message}</p>
            <button onclick="window.location.reload()" style="
              margin-top: 24px;
              padding: 12px 24px;
              background: #FF6B35;
              color: #050505;
              border: none;
              border-radius: 8px;
              font-family: 'JetBrains Mono', monospace;
              font-weight: bold;
              cursor: pointer;
            ">RETRY CONNECTION</button>
          </div>
        </div>
      `
    }
  }
}

// Start the bootstrap process
bootstrap()
