import { db } from "./db";

export async function initializeSchema() {
  // TODO: move to an ORM
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      avatar_url TEXT
    );

    CREATE TABLE IF NOT EXISTS repositories (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, name)
    );

    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
      issue_number INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'inprogress', 'done'
      author TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Safe migration for existing schemas
    DO $$ 
    BEGIN 
      BEGIN
        ALTER TABLE issues ADD COLUMN issue_number INTEGER;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END;
    END $$;

    CREATE TABLE IF NOT EXISTS tags (
      id SERIAL PRIMARY KEY,
      repository_id INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#8b949e',
      UNIQUE(repository_id, name)
    );

    CREATE TABLE IF NOT EXISTS issue_tags (
      issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (issue_id, tag_id)
    );
  `);
}

export async function ensureUserAndSeed(user: {
  id: string;
  username: string;
  image?: string;
}) {
  // Upsert user
  // TODO: move to an ORM
  await db.query(
    `INSERT INTO users (id, username, avatar_url)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET
       username = EXCLUDED.username,
       avatar_url = EXCLUDED.avatar_url`,
    [user.id, user.username, user.image || null],
  );
}
