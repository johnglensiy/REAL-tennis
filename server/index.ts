import express from 'express';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import eventsRoutes from './routes/events.routes.ts';

import fs from 'fs';

import extractSnapshotFromMatchData from './utils/extractSnapshotFromMatchData.ts';
import { buildPointForMockStream } from './utils/buildPointForMockStream.ts';
import { MatchEntry } from './types.ts';
import { decryptResponse, decryptResponseRG } from './scripts/rolandgarros.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

export let browser: Browser;
export let context: BrowserContext;
export let page: Page;

export const matchDataClients = new Set<any>();

// launch playwright instance
// current URL data source is ATP tour current scores home page (not all scores are from here btw)
// eventually should be loaded on a docker instance so it's not reliant on my computer running
browser = await chromium.launch({ channel: 'chrome', headless: true })
context = await browser.newContext();
page = await context.newPage();

// // check for live Roland Garros matches
// await page.goto("https://www.rolandgarros.com/en-us/matches?status=live");

// const noLiveResults = await page.locator('.main-content .no-results').count();
// if (noLiveResults > 0) {
//     console.log('[RG] No live matches currently. Will send mock live matches.');
// } else {
//     console.log('[RG] Live matches found.');
//     // nav and open a new page for each live match
// }

// this will eventually migrate to a DB
const allMatchData: Map<string, MatchEntry> = new Map();
let decryptedJSON;
let counter: number = 0;

page.on('response', async (response) => {
    const url = response.url();
    
    // TODO: add heartbeat monitoring if certain responses are not coming in
    if (url.includes('match-beats/data')) {
        console.log(allMatchData);
        try {
            const json = await response.json();
            decryptedJSON = decryptResponse(json);
            fs.writeFileSync(`match-beats-${counter}.json`, JSON.stringify(decryptedJSON, null, 2));
            console.log('match-beats written');
            counter += 1;

            // cast to point type

            // deduce match id
            const receivedMatchId = `${decryptedJSON.playerData.tm1Ply1Id}-${decryptedJSON.playerData.tm2Ply1Id}-${decryptedJSON.eventId}-${decryptedJSON.matchId}-${decryptedJSON.year}`;
            let thisMatchEntry: any;

            // write to server mapping if not there yet
            if (!allMatchData.has(receivedMatchId)) {
                // placeholder: add logic here to insert mapping if necessary
                const newBlankMatch: MatchEntry = {
                    matchId: receivedMatchId,
                    matchStatus: decryptedJSON.matchStatus,
                    playerTeamInfo: {
                        atpId: decryptedJSON.playerData.tm1Ply1Id,
                        firstName: decryptedJSON.playerData.tm1Ply1FirstName,
                        lastName: decryptedJSON.playerData.tm1Ply1LastName,
                        seed: decryptedJSON.playerData.tm1Seed,
                        country: decryptedJSON.playerData.tm1Ply1Country,
                    },
                    opponentTeamInfo: {
                        atpId: decryptedJSON.playerData.tm2Ply1Id,
                        firstName: decryptedJSON.playerData.tm2Ply1FirstName,
                        lastName: decryptedJSON.playerData.tm2Ply1LastName,
                        seed: decryptedJSON.playerData.tm2Seed,
                        country: decryptedJSON.playerData.tm1Ply2Country,
                    },
                    events: [],
                    latestPointId: null,
                    latestPointWithRallyDataId: null
                }

                allMatchData.set(receivedMatchId, newBlankMatch);
            }

            thisMatchEntry = allMatchData.get(receivedMatchId);
            // update server mapping
            if (decryptedJSON.setData) {
                // for every point not here, bulk SSE write a list of points
                // TODO: change endpoint on client side to accept multiple points
                // depending on mb or cv we need to update or insert new point
                // Throw an error if thisMatchEntry is missing (should be impossible)
                if (!thisMatchEntry) {
                    throw new Error(`Impossible: matchRecord not found for matchId ${receivedMatchId}`);
                }
                const latestPointId = thisMatchEntry.latestPointId;
                const newPoints: any[] = [];

                if (!latestPointId) {
                    // No points seen yet — collect everything
                    for (let si = 0; si < decryptedJSON.setData.length; si++) {
                        const set = decryptedJSON.setData[si];
                        for (let gi = 0; gi < set.gameData.length; gi++) {
                            const game = set.gameData[gi];
                            for (const point of game.pointData) {
                                newPoints.push(buildPointForMockStream(decryptedJSON, si, gi, point));
                            }
                        }
                    }
                } else {
                    const [latestSet, latestGame, latestPoint] = latestPointId.split('_').map(Number);
                    for (let si = 0; si < decryptedJSON.setData.length; si++) {
                        const set = decryptedJSON.setData[si];
                        if (set.set < latestSet) continue;
                        for (let gi = 0; gi < set.gameData.length; gi++) {
                            const game = set.gameData[gi];
                            if (set.set === latestSet && game.game < latestGame) continue;
                            for (const point of game.pointData) {
                                if (set.set === latestSet && game.game === latestGame && point.point <= latestPoint) continue;
                                newPoints.push(buildPointForMockStream(decryptedJSON, si, gi, point));
                            }
                        }
                    }
                }
                
                // Write new points to all SSE clients, then store in mapping
                if (newPoints.length > 0) {
                    for (const client of matchDataClients) {
                        client.write(`data: ${JSON.stringify(newPoints)}\n\n`);
                    }
                    thisMatchEntry.events.push(...newPoints);
                    thisMatchEntry.latestPointId = newPoints[newPoints.length - 1].updateId;
                }
            }

        } catch (e) {
            console.log('match-beats error', e);
        }
    } else if (url.includes('he-data.json')) {
        try {
            const json = await response.json();
            decryptedJSON = decryptResponseRG(json);
            fs.writeFileSync('test.json', JSON.stringify(decryptedJSON, null, 2));
            console.log('he-data written');

            

        } catch (e) {
            console.log('he-data error', e);
        }
    }
});

await page.goto("https://www.rolandgarros.com/en-us/matches/2026/SM005");

// populate in-memory mapping
// on server start, we get the he-data.json of all live matches
// first check if match-id key exists
// if exists then diff with 

// get upcoming matches and store them in memory

// app configs
app.use('/', eventsRoutes);

app.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});