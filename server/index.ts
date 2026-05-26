import express from 'express';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import eventsRoutes, { startWatchingSingleMatchData } from './routes/events.routes.ts';

import extractSnapshotFromMatchData from './utils/extractSnapshotFromMatchData.ts';
import { SetScore, TeamSnapshot, MatchSnapshot } from './types.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

export let browser: Browser;
export let context: BrowserContext;
export let page: Page;

export let matchDataClients: any;

// launch playwright instance
// current URL data source is ATP tour current scores home page (not all scores are from here btw)
// eventually should be loaded on a docker instance so it's not reliant on my computer running
browser = await chromium.launch({ channel: 'chrome', headless: false })
context = await browser.newContext();
page = await context.newPage();
await page.goto("https://www.atptour.com/en/scores/current");

// page handler that intercept any responses from webpage naturally polling
let allMatchSnapshots: MatchSnapshot[];

page.on('response', async (response) => {
    if (!response.url().includes('livematches')) return;

    try {
        const json = await response.json();
        const tournaments = json.Data?.LiveMatchesTournamentsOrdered ?? [];

        allMatchSnapshots = [];

        for (const tournament of tournaments) {
            const liveMatches = tournament.LiveMatches?.filter((m: any) => {
                return m.MatchStatus == "P";
            });

            if (liveMatches.length === 0) continue;

            for (const lm of liveMatches) {
                const liveSnapshot = extractSnapshotFromMatchData(lm);
                allMatchSnapshots?.push(liveSnapshot);
                console.log(`[MATCHDATA] ${liveSnapshot.playerTeam.name} ${liveSnapshot.playerTeam.gameScore} | ${liveSnapshot.opponentTeam.name} ${liveSnapshot.opponentTeam.gameScore}`);
            }
        }

        // push all live match snapshots together to client
        for (const client of matchDataClients) {
            client.write(`data: ${JSON.stringify(allMatchSnapshots)}\n\n`);
        }
    } catch (e) {
        console.log(e);
    }
})

// app configs
app.use('/', eventsRoutes);

app.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});