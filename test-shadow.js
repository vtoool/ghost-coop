const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleMessages = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });

  console.log('Navigating to deployed site...');
  await page.goto('https://ghost-coop.vercel.app', { waitUntil: 'networkidle' });

  console.log('Page loaded, waiting for content...');
  await page.waitForTimeout(2000);

  // Check page title and basic content
  const title = await page.title();
  console.log('Page title:', title);

  // Look for name input to enter dev mode
  const nameInput = await page.$('input[placeholder*="name" i], input[type="text"]');
  if (nameInput) {
    console.log('Found name input, entering dev mode...');
    await nameInput.fill('dev');
    await page.waitForTimeout(500);

    // Look for start/dev button
    const startButton = await page.$('button:has-text("Dev"), button:has-text("Start")');
    if (startButton) {
      console.log('Clicking start button...');
      await startButton.click();
      await page.waitForTimeout(3000);
    }
  } else {
    console.log('No name input found, checking if already in game...');
  }

  // Take screenshot
  await page.screenshot({ path: 'screenshot-game.png', fullPage: true });
  console.log('Screenshot saved to screenshot-game.png');

  // Report console errors
  console.log('\n--- Console Errors ---');
  if (consoleErrors.length === 0) {
    console.log('No console errors!');
  } else {
    consoleErrors.forEach(err => console.log('ERROR:', err));
  }

  console.log('\n--- All Console Messages ---');
  consoleMessages.forEach(msg => {
    if (msg.type !== 'log' || msg.text.includes('Performance') || msg.text.includes('Emissive')) {
      console.log(`[${msg.type}] ${msg.text.substring(0, 200)}`);
    }
  });

  await browser.close();
  console.log('\nDone!');
})();
