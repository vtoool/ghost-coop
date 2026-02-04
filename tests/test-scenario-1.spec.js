import { test, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Test Scenario 1: Host Initialization', async () => {
  // Create screenshot directory
  const screenshotDir = path.join(process.cwd(), 'test-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Launch browser with Desktop Chrome viewport
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  // Navigate to production URL
  console.log('Navigating to https://ghost-coop.vercel.app');
  await page.goto('https://ghost-coop.vercel.app');

  // Wait 3 seconds for Playroom initialization
  console.log('Waiting 3 seconds for Playroom initialization...');
  await page.waitForTimeout(3000);

  // Take screenshot of welcome screen
  const welcomeScreenshot = path.join(screenshotDir, '01-welcome-screen.png');
  await page.screenshot({ path: welcomeScreenshot, fullPage: true });
  console.log(`Screenshot saved: ${welcomeScreenshot}`);

  // Enter nickname
  console.log('Entering nickname "GhostHost"...');
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.fill('GhostHost');

  // Click ENTER THE HAUNTED HOUSE button
  console.log('Clicking "ENTER THE HAUNTED HOUSE" button...');
  const enterButton = page.locator('button:has-text("ENTER THE HAUNTED HOUSE")');
  await enterButton.click();

  // Wait for lobby to load
  console.log('Waiting for lobby to load...');
  await page.waitForTimeout(3000);

  // Take screenshot of lobby
  const lobbyScreenshot = path.join(screenshotDir, '02-lobby-screen.png');
  await page.screenshot({ path: lobbyScreenshot, fullPage: true });
  console.log(`Screenshot saved: ${lobbyScreenshot}`);

  // Extract room code from URL
  const url = page.url();
  const roomCodeMatch = url.match(/#([A-Z0-9]+)/);
  const roomCode = roomCodeMatch ? roomCodeMatch[1] : 'NOT_FOUND';
  console.log(`Room code extracted: ${roomCode}`);

  // Save test results
  const results = {
    screenshots: {
      welcome: welcomeScreenshot,
      lobby: lobbyScreenshot
    },
    url: url,
    roomCode: roomCode,
    timestamp: new Date().toISOString()
  };

  const resultsPath = path.join(screenshotDir, 'test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`Results saved: ${resultsPath}`);

  await browser.close();
});
