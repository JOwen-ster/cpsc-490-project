import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS test_items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function GET() {
  await ensureTable();
  const r = await pool.query(`SELECT * FROM test_items ORDER BY id DESC LIMIT 200`);
  return Response.json({ ok: true, items: r.rows });
}

export async function POST(req: Request) {
  await ensureTable();
  const body = await req.json();

  const name = String(body.name ?? "").trim();
  const note = body.note == null ? null : String(body.note);

  if (!name) {
    return Response.json({ ok: false, error: "name is required" }, { status: 400 });
  }

  const r = await pool.query(
    `INSERT INTO test_items (name, note) VALUES ($1, $2) RETURNING *`,
    [name, note]
  );

  return Response.json({ ok: true, item: r.rows[0] }, { status: 201 });
}
