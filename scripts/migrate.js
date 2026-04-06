const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = "postgresql://neondb_owner:npg_4YxScFbyR1As@ep-late-band-ancscomw-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function runMigration() {
  console.log("Connecting to database...");
  const sql = neon(DATABASE_URL);

  try {
    console.log("Dropping old chat_history & transactions table if exists...");
    await sql`DROP TABLE IF EXISTS chat_history`;
    await sql`DROP TABLE IF EXISTS transactions`;
    console.log("Success dropping chat_history & transactions table");
  } catch (error) {
    console.error("❌ Migration failed:");
    console.error(error);
  }
}

runMigration();
