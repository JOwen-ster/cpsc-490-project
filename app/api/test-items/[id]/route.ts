import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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

function parseId(raw: unknown) {
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  await ensureTable();
  const { id: idRaw } = await ctx.params;

  const id = parseId(idRaw);
  if (id == null) {
    return Response.json({ ok: false, error: `invalid id: ${idRaw}` }, { status: 400 });
  }

  const r = await pool.query(`SELECT * FROM test_items WHERE id=$1`, [id]);
  return Response.json({ ok: true, item: r.rows[0] ?? null });
}

export async function PUT(req: Request, ctx: Ctx) {
  await ensureTable();
  const { id: idRaw } = await ctx.params;

  const id = parseId(idRaw);
  if (id == null) {
    return Response.json({ ok: false, error: `invalid id: ${idRaw}` }, { status: 400 });
  }

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const note = body.note == null ? null : String(body.note);

  if (!name) {
    return Response.json({ ok: false, error: "name is required" }, { status: 400 });
  }

  const r = await pool.query(
    `UPDATE test_items SET name=$2, note=$3 WHERE id=$1 RETURNING *`,
    [id, name, note]
  );

  return Response.json({ ok: true, item: r.rows[0] ?? null });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  await ensureTable();
  const { id: idRaw } = await ctx.params;

  const id = parseId(idRaw);
  if (id == null) {
    return Response.json({ ok: false, error: `invalid id: ${idRaw}` }, { status: 400 });
  }

  const r = await pool.query(`DELETE FROM test_items WHERE id=$1 RETURNING *`, [id]);
  return Response.json({ ok: true, deleted: r.rows[0] ?? null });
}
