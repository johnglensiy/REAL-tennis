import { chromium, devices } from 'playwright';
import assert from 'node:assert';

// setup browser
const browser = await chromium.launch({ channel: 'chrome', headless: false });
const context = await browser.newContext();
const page = await context.newPage();

await context.route('**.jpg', route => route.abort());
await page.goto('https://www.atptour.com/en/scores/current');

// const pageTitle = await page.title()
// console.log(pageTitle)

// Get all tournaments
const tournaments = page.locator('.tournament');

// Find Geneva specifically
const genevaTournament = page.locator('.tournament').filter({
  has: page.locator('h3.title', { hasText: 'Geneva' })
});

// Get the first match within it
const firstMatch = genevaTournament.locator('.match').first();

// Extract what you need
const player1 = await firstMatch.locator('.stats-item').first().locator('.name a').innerText();
const player2 = await firstMatch.locator('.stats-item').last().locator('.name a').innerText();
const notes = await firstMatch.locator('.match-notes').innerText();

console.log(player1, player2, notes);

await context.close();
await browser.close();