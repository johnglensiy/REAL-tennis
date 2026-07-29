import { Router } from "express";
import { context, page } from "../index.ts";
import winnersRaw from "../data/winnersRaw.ts";
import { parseWinners } from "../utils/parseWinners.ts";
import { streamPointAndScheduleNext } from "../utils/streamPointAndScheduleNext.ts";
import pbp_tien_navone from "../data/tien-navone-pbp.json";
import fs from "fs";
import path from "path";
import { buildPointsFromCourtVision } from "../utils/buildPointsFromCourtVision.ts";
import type { PointDTO } from "../../common/types.ts";
import * as pointsRepo from "../db/pointsRepo.ts";

const COURT_VISION_FILE = "court-vision3d-firstservein.json";

import { matchDataClients, allMatchData, scheduledMatches } from "../index.ts";

const router = Router();

// dev-only endpoint for UI testing (when no live matches are playing)
router.get("/matchdata/mock-stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // in prod playwright will open the corresponding Matchbeats tab of the match
  // a mock stream (pbp) uses some of the example data
  // then streams it with a setInterval

  // for each data json in data folder trigger point stream loop
  const dataDirPath = path.join(import.meta.dirname, "../data");

  for (const file of fs.readdirSync(dataDirPath)) {
    if (!file.endsWith(".json")) continue;

    const fullPath = path.join(dataDirPath, file);
    const json = JSON.parse(fs.readFileSync(fullPath, "utf-8"));

    console.log(
      `Triggering stream loop for ${json.playerData.tm1Ply1LastName} vs. ${json.playerData.tm2Ply1LastName}`,
    );
    streamPointAndScheduleNext(res, json, 0, 0, 0);
  }

  //streamPointAndScheduleNext(res, pbp_tien_navone, 0, 0, 0);
  req.on("close", () => matchDataClients.delete(res));

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
router.get("/matchdata/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Send all existing events from the server mapping on connect (these are events/points)
  const allEvents = [...allMatchData.values()].flatMap((entry) => entry.events);
  if (allEvents.length > 0) {
    res.write(`data: ${JSON.stringify(allEvents)}\n\n`);
  }

  // Send scheduled (upcoming) matches on connect, one event per message
  for (const match of scheduledMatches) {
    res.write(`data: ${JSON.stringify(match)}\n\n`);
  }

  matchDataClients.add(res);
  req.on("close", () => matchDataClients.delete(res));
});

// Point history for a match, from the court-vision dump. Dev-only: the file is
// one specific recorded match (MERIDA v DZUMHUR), served under whatever matchId
// is asked for so it can be pinned onto a stub match in the client.
// Parsed per request — it's a 1.6MB file and this isn't on a hot path.
let pointsCache: PointDTO[] | null = null;

router.get("/matchdata/points/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;

    // Mongo is authoritative once a match's points have been persisted —
    // skip re-parsing the 1.6MB court-vision file on every request.
    const stored = await pointsRepo.getPointsForMatch(matchId);
    if (stored.length > 0) {
      res.json(stored);
      return;
    }

    if (!pointsCache) {
      const file = path.join(import.meta.dirname, "..", COURT_VISION_FILE);
      pointsCache = buildPointsFromCourtVision(
        JSON.parse(fs.readFileSync(file, "utf8")),
        "", // matchId is stamped per-request below
      );
    }
    const points = pointsCache.map((p) => ({ ...p, matchId }));
    await pointsRepo.upsertPoints(points);
    res.json(points);
  } catch (err) {
    console.error("[points] failed to build point history", err);
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get("/", async (req, res) => {
  console.log("Routing to events API");
  res.json({ message: `Watching match` });
});

export default router;
