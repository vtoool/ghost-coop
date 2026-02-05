const { chromium } = require('playwright');

(async () => {
  console.log('Starting test...');
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

  const input = await page.$('input[placeholder*="CALLSIGN"]');
  if (input) {
    console.log('Filling "dev"...');
    await input.fill('dev');
    await page.waitForTimeout(500);

    const enterBtn = await page.$('button:has-text("ENTER")');
    if (enterBtn) {
      console.log('Clicking ENTER...');
      await enterBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  const readyBtn = await page.$('button:has-text("READY")');
  if (readyBtn) {
    console.log('Clicking READY...');
    await readyBtn.click();
    await page.waitForTimeout(2000);
  }

  const soloBtn = await page.$('button:has-text("PLAY SOLO")');
  if (soloBtn) {
    console.log('Clicking PLAY SOLO...');
    await soloBtn.click();
    await page.waitForTimeout(5000);
  }

  const canvas = await page.$('canvas');
  console.log('Canvas found:', !!canvas);

  await page.screenshot({ path: 'screenshot-shadow-test.png', fullPage: true });
  console.log('Screenshot saved');

  await browser.close();
  console.log('Done!');
})();
