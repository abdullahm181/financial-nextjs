import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_4YxScFbyR1As@ep-late-band-ancscomw-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

/**
 * Creates a Neon SQL query function.
 */
export function getDb() {
  return neon(DATABASE_URL);
}
