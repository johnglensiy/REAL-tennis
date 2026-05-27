import { Router } from 'express';
import { context, page } from '../index.ts';
import winnersRaw from '../data/winnersRaw.ts';
import { parseWinners } from '../utils/parseWinners.ts';
import { streamPointAndScheduleNext } from '../utils/streamPointAndScheduleNext.ts';
import pbp_tien_navone from '../data/tien-navone-pbp.json';
import fs from 'fs';
import path from 'path';

import { allMatchSnapshots, matchDataClients } from '../index.ts';

import { SetScore, TeamSnapshot, MatchSnapshot } from '../types.ts';

const router = Router();

// dev-only endpoint for UI testing (when no live matches are playing)
router.get('/matchdata/mock-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // in prod playwright will open the corresponding Matchbeats tab of the match
    // a mock stream (pbp) uses some of the example data
    // then streams it with a setInterval

    // for each data json in data folder trigger point stream loop
    const dataDirPath = path.join(import.meta.dirname, '../data');

    for (const file of fs.readdirSync(dataDirPath)) {
        if (!file.endsWith('.json')) continue;

        const fullPath = path.join(dataDirPath, file);
        const json = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

        console.log(`Triggering stream loop for ${json.playerData.tm1Ply1LastName} vs. ${json.playerData.tm2Ply1LastName}`)
        streamPointAndScheduleNext(res, json, 0, 0, 0);
    }

    //streamPointAndScheduleNext(res, pbp_tien_navone, 0, 0, 0);
    req.on('close', () => matchDataClients.delete(res));    

    // example pbp http request 
    // this was the URL for Buse-Paul Hamburg final
    // tournaments without rally analysis still display how the point ended
    // https://itp-atp-sls.infosys-platforms.com/prod/api/match-beats/data/year/2026/eventId/414/matchId/MS001
    // and for the Tien-Navone Geneva final
    // https://itp-atp-sls.infosys-platforms.com/prod/api/match-beats/data/year/2026/eventId/322/matchId/MS001?TAB=MATCHBEATS
    // the Geneva final had rally data so here were additional URls that were fetched
    // rally analysis by number of shots: https://itp-atp-sls.infosys-platforms.com/prod/api/rally-analysis/year/2026/eventId/322/matchId/MS001?TAB=MATCHBEATS
    // 
    // push all live match snapshots together to client
});

// SSEs all live matches from the ATP live matches URL
router.get('/matchdata/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (allMatchSnapshots && allMatchSnapshots.length > 0) {
        res.write(`data: ${JSON.stringify(allMatchSnapshots)}\n\n`);
    }

    matchDataClients.add(res);
    req.on('close', () => matchDataClients.delete(res));
});

router.get('/', async (req, res) => {
    console.log("Routing to events API");
    res.json({ message: `Watching match` });
});

export default router;