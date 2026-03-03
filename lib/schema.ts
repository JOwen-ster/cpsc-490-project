import { db } from "./db";

export async function initializeSchema() {
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
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'inprogress', 'done'
      author TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

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

export async function ensureUserAndSeed(user: { id: string; username: string; image?: string }) {
  // Upsert user
  await db.query(
    `INSERT INTO users (id, username, avatar_url)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET
       username = EXCLUDED.username,
       avatar_url = EXCLUDED.avatar_url`,
    [user.id, user.username, user.image || null]
  );

  // Check if user has any repositories
  const reposResult = await db.query(
    `SELECT id FROM repositories WHERE user_id = $1 LIMIT 1`,
    [user.id]
  );

  if (reposResult.rowCount === 0) {
    // Seed default repository
    const repoInsert = await db.query(
      `INSERT INTO repositories (user_id, name, description)
       VALUES ($1, $2, $3) RETURNING id`,
      [user.id, 'cpsc-490', 'Default project repository']
    );
    const repoId = repoInsert.rows[0].id;

    // Seed default tags
    const tagsInsert = await db.query(
      `INSERT INTO tags (repository_id, name, color)
       VALUES 
         ($1, 'bug', '#d73a4a'),
         ($1, 'enhancement', '#a2eeef'),
         ($1, 'documentation', '#0075ca')
       RETURNING id, name`,
      [repoId]
    );
    
    const tagMap = tagsInsert.rows.reduce((acc, row) => {
      acc[row.name] = row.id;
      return acc;
    }, {} as Record<string, number>);

    // Seed default issues
    const issuesInsert = await db.query(
      `INSERT INTO issues (repository_id, title, description, status, author)
       VALUES 
         ($1, 'Fix sidebar rendering', 'Sidebar is missing on mobile.', 'todo', $2),
         ($1, 'Integrating Auth.js', 'Setup GitHub OAuth.', 'inprogress', $2),
         ($1, 'Create database schema', 'Plan and implement Postgres schema.', 'done', $2)
       RETURNING id, title`,
      [repoId, `@\${user.username}`]
    );

    const issuesMap = issuesInsert.rows.reduce((acc, row) => {
      acc[row.title] = row.id;
      return acc;
    }, {} as Record<string, number>);

    // Link issue tags
    if (tagMap['bug'] && issuesMap['Fix sidebar rendering']) {
      await db.query(
        `INSERT INTO issue_tags (issue_id, tag_id) VALUES ($1, $2)`,
        [issuesMap['Fix sidebar rendering'], tagMap['bug']]
      );
    }
    if (tagMap['enhancement'] && issuesMap['Integrating Auth.js']) {
      await db.query(
        `INSERT INTO issue_tags (issue_id, tag_id) VALUES ($1, $2)`,
        [issuesMap['Integrating Auth.js'], tagMap['enhancement']]
      );
    }
  }
}
