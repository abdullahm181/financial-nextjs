-- Run this SQL in your Neon dashboard (SQL Editor) to create the chat_history table.
-- https://console.neon.tech -> Your Project -> SQL Editor

CREATE TABLE IF NOT EXISTS chat_history (
  id SERIAL PRIMARY KEY,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'bot')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
