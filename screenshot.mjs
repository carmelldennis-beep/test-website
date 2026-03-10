import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDir = join(__dirname, 'temporary screenshots');

if (!existsSync(screenshotDir)) {
  mkdirSync(screenshotDir, { recursive: true });
}

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

// Auto-increment screenshot number
const existing = existsSync(screenshotDir)
  ? readdirSync(screenshotDir).filter(f => f.endsWith('.png'))
  : [];
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;
const outputPath = join(screenshotDir, filename);

const browser = await puppeteer.launch({
  executablePath: 'C:/Users/MCC-Inc/.cache/puppeteer/chrome/win64-146.0.7680.31/chrome-win64/chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2' });

// Scroll through page to trigger IntersectionObserver animations
await page.evaluate(async () => {
  await new Promise(resolve => {
    const distance = 300;
    const delay = 80;
    const timer = setInterval(() => {
      window.scrollBy(0, distance);
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight) {
        window.scrollTo(0, 0);
        clearInterval(timer);
        setTimeout(resolve, 400);
      }
    }, delay);
  });
});

await page.screenshot({ path: outputPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outputPath}`);
