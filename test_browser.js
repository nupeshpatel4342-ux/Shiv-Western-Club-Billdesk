import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure().errorText));

  console.log('Navigating to localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'load' });
  
  console.log('Page loaded. Waiting 3 seconds for rendering...');
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  
  console.log('Done.');
  await browser.close();
})();
