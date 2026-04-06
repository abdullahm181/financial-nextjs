const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = "postgresql://neondb_owner:npg_4YxScFbyR1As@ep-late-band-ancscomw-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function runMigration() {
  console.log("Connecting to database...");
  const sql = neon(DATABASE_URL);

  try {
    console.log("Running migration...");
    await sql`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'bot')),
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log("✅ Migration successful! Table 'chat_history' is ready.");
  } catch (error) {
    console.error("❌ Migration failed:");
    console.error(error);
  }
}

runMigration();
