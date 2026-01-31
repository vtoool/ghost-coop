import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { insertCoin } from 'playroomkit'
import './index.css'
import App from './App.jsx'

/**
 * Bootstrapper - The Entry Point
 * CRITICAL: Do NOT render React until Playroom is initialized
 * This prevents the "Double Lobby" race condition
 */
async function bootstrap() {
  try {
    // Initialize Playroom first (before React wakes up)
    await insertCoin({
      skipLobby: true,
      streamMode: true,
    })
    
    // Only render React after Playroom gives the green light
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    console.error('Failed to initialize Playroom:', error)
    // Show error to user
    document.getElementById('root').innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        color: white;
        font-family: sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <h1 style="color: #ff4444; margin-bottom: 16px;">Connection Error</h1>
          <p>Failed to initialize multiplayer. Please refresh and try again.</p>
          <p style="color: #888; font-size: 14px; margin-top: 8px;">${error.message}</p>
        </div>
      </div>
    `
  }
}

// Start the bootstrap process
bootstrap()
