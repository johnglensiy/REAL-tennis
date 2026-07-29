import { getDb } from "./connection.ts";
import type { MatchScheduled, ScoreUpdated } from "../../common/types.ts";

// Mirrors the client's MatchStateOld entity shape (matchesSlice) minus the
// nested point history, which lives in its own collection — same split as
// the redux matches/points slices.
export interface MatchDoc {
  _id: string; // matchId
  tournamentId: string;
  status: "upcoming" | "live";
  scheduledDate?: string;
  scheduledTime?: string;
  round?: string;
  court?: string;
  a: PlayerSnapshot;
  b: PlayerSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerSnapshot {
  name: string;
  country: string;
  atpId?: string;
  seed?: string;
  sets?: number[];
  pts?: string;
  serving?: boolean;
}

function matchesCollection() {
  return getDb().collection<MatchDoc>("matches");
}

// Mirrors matchesSlice's matchScheduled reducer: create-or-ignore on the
// player/schedule identity carried by the schedule scrape.
export async function upsertScheduledMatch(ev: MatchScheduled): Promise<void> {
  const now = new Date();
  await matchesCollection().updateOne(
    { _id: ev.matchId },
    {
      $setOnInsert: {
        _id: ev.matchId,
        status: "upcoming",
        createdAt: now,
      },
      $set: {
        tournamentId: ev.tournamentId,
        scheduledDate: ev.scheduledDate,
        scheduledTime: ev.scheduledTime,
        round: ev.round,
        court: ev.court,
        a: {
          name: ev.playerA.name,
          country: ev.playerA.country,
          atpId: ev.playerA.atpId ?? undefined,
          seed: ev.playerA.seed,
        },
        b: {
          name: ev.playerB.name,
          country: ev.playerB.country,
          atpId: ev.playerB.atpId ?? undefined,
          seed: ev.playerB.seed,
        },
        updatedAt: now,
      },
    },
    { upsert: true },
  );
}

// Mirrors matchesSlice's scoreUpdated reducer: ScoreUpdated carries no
// player identity beyond name/country/seed, so merge onto whatever schedule
// doc already exists instead of overwriting it.
export async function upsertScoreUpdate(ev: ScoreUpdated): Promise<void> {
  const now = new Date();
  const existing = await matchesCollection().findOne({ _id: ev.matchId });

  const a: PlayerSnapshot = {
    name: ev.playerScore.name,
    country: ev.playerScore.country,
    seed: ev.playerScore.seed,
    sets: ev.playerScore.setScores.filter((s): s is number => s !== null),
    pts: ev.playerScore.gameScore,
    serving: ev.server === "p",
  };
  const b: PlayerSnapshot = {
    name: ev.opponentScore.name,
    country: ev.opponentScore.country,
    seed: ev.opponentScore.seed,
    sets: ev.opponentScore.setScores.filter((s): s is number => s !== null),
    pts: ev.opponentScore.gameScore,
    serving: ev.server === "o",
  };

  await matchesCollection().updateOne(
    { _id: ev.matchId },
    {
      $setOnInsert: {
        _id: ev.matchId,
        tournamentId: existing?.tournamentId ?? "wimbledon",
        createdAt: now,
      },
      $set: { status: "live", a, b, updatedAt: now },
    },
    { upsert: true },
  );
}

export async function getMatchById(matchId: string): Promise<MatchDoc | null> {
  return matchesCollection().findOne({ _id: matchId });
}

export async function getAllMatches(): Promise<MatchDoc[]> {
  return matchesCollection().find().toArray();
}
