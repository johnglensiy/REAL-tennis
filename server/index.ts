import express from 'express';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import eventsRoutes, { startWatching } from './routes/events.routes.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

export let browser: Browser;
export let context: BrowserContext;
export let page: Page;

browser = await chromium.launch({ channel: 'chrome', headless: false })
context = await browser.newContext();
page = await context.newPage();
await page.goto("https://www.atptour.com/en/scores/stats-centre/live/2026/322/MS029?tab=CourtVision")
// startWatching();

app.use('/', eventsRoutes);

app.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});