import "dotenv/config";
import { MongoClient, type Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "real_tennis";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToMongo(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(MONGODB_DB_NAME);

  console.log(`[mongo] connected to ${MONGODB_URI}/${MONGODB_DB_NAME}`);
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error(
      "[mongo] not connected yet — call connectToMongo() during server startup first",
    );
  }
  return db;
}

export async function closeMongo(): Promise<void> {
  await client?.close();
  client = null;
  db = null;
}
