const { chromium } = require('playwright');

(async () => {
  console.log('Starting...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Performance') || text.includes('FPS') || text.includes('Frame')) {
      console.log('PERF:', text.substring(0, 200));
    }
  });

  page.on('pageerror', err => {
    console.log('Page error:', err.message);
  });

  console.log('Navigating...');
  await page.goto('https://ghost-coop.vercel.app', { timeout: 30000 });
  await page.waitForTimeout(2000);

  // Step 1: Enter name "dev"
  const input = await page.$('input[placeholder*="CALLSIGN"]');
  if (input) {
    console.log('Step 1: Filling "dev"...');
    await input.fill('dev');
    await page.waitForTimeout(500);

    // Click ENTER THE HAUNTED HOUSE
    const enterBtn = await page.$('button:has-text("ENTER")');
    if (enterBtn) {
      console.log('Step 2: Clicking ENTER...');
      await enterBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  // Step 2: Click READY FOR HAUNT
  const readyBtn = await page.$('button:has-text("READY")');
  if (readyBtn) {
    console.log('Step 3: Clicking READY...');
    await readyBtn.click();
    await page.waitForTimeout(2000);
  }

  // Step 3: Click PLAY SOLO (DEV MODE)
  const soloBtn = await page.$('button:has-text("PLAY SOLO")');
  if (soloBtn) {
    console.log('Step 4: Clicking PLAY SOLO...');
    await soloBtn.click();
    await page.waitForTimeout(5000);
  }

  // Check for canvas
  const canvas = await page.$('canvas');
  console.log('Canvas found:', !!canvas);

  // Screenshot
  await page.screenshot({ path: 'screenshot-game.png', fullPage: true });
  console.log('Screenshot saved');

  // Check console errors
  const errors = await page.evaluate(() => {
    return window.__errors || [];
  });

  await browser.close();
  console.log('Done!');
})();
