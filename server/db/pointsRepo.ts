import { getDb } from "./connection.ts";
import type { PointDTO } from "../../common/types.ts";

// One document per point. _id is composite since a point's `id` is only
// unique within its match (see PointDTO's docstring) — this also makes
// upserts a single indexed write instead of a separate unique index.
type PointDoc = PointDTO & { _id: string; receivedAt: Date };

function pointsCollection() {
  return getDb().collection<PointDoc>("points");
}

const docId = (matchId: string, pointId: string) => `${matchId}:${pointId}`;

export async function upsertPoints(points: PointDTO[]): Promise<void> {
  if (points.length === 0) return;

  const now = new Date();
  await pointsCollection().bulkWrite(
    points.map((p) => ({
      updateOne: {
        filter: { _id: docId(p.matchId, p.id) },
        update: {
          $set: { ...p },
          $setOnInsert: { receivedAt: now },
        },
        upsert: true,
      },
    })),
  );
}

// Chronological within the match — timeElapsed is monotonic per PointDTO.
export async function getPointsForMatch(matchId: string): Promise<PointDTO[]> {
  const docs = await pointsCollection()
    .find({ matchId })
    .sort({ timeElapsed: 1 })
    .toArray();
  return docs.map(({ _id, receivedAt, ...point }) => point);
}
