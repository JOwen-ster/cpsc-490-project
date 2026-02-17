"use client";

import { useEffect, useState } from "react";

type TestItem = {
  id: number;
  name: string;
  note: string | null;
  created_at: string;
};

async function readJsonSafe(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export default function TestItemsPage() {
  const [items, setItems] = useState<TestItem[]>([]);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);

    const res = await fetch("/api/test-items", { cache: "no-store" });
    const data = await readJsonSafe(res);

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || "Failed to load items");
    }

    setItems(Array.isArray(data.items) ? data.items : []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function onSubmit() {
    setBusy(true);
    setError(null);

    try {
      const n = name.trim();
      if (!n) throw new Error("Name is required.");

      if (editingId == null) {
        const res = await fetch("/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: n, note }),
        });

        const data = await readJsonSafe(res);
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Create failed");
      } else {
        const res = await fetch(`/api/test-items/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: n, note }),
        });

        const data = await readJsonSafe(res);
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Update failed");
      }

      setName("");
      setNote("");
      setEditingId(null);
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  function startEdit(x: TestItem) {
    setEditingId(x.id);
    setName(x.name);
    setNote(x.note ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setNote("");
  }

  async function remove(id: number) {
    if (!Number.isFinite(id)) {
      setError("Delete failed: invalid id");
      return;
    }

    if (!confirm(`Delete item #${id}?`)) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/test-items/${id}`, { method: "DELETE" });
      const data = await readJsonSafe(res);

      if (!res.ok || (data && data.ok === false)) {
        throw new Error(data?.error || "Delete failed");
      }

      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        DB CRUD Test (test_items)
      </h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="name (required)"
          style={{ padding: 10, minWidth: 220, flex: "1 1 220px" }}
          disabled={busy}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="note (optional)"
          style={{ padding: 10, minWidth: 280, flex: "2 1 280px" }}
          disabled={busy}
        />

        <button onClick={onSubmit} disabled={busy} style={{ padding: "10px 14px" }}>
          {editingId == null ? "Create" : `Update #${editingId}`}
        </button>

        {editingId != null && (
          <button onClick={cancelEdit} disabled={busy} style={{ padding: "10px 14px" }}>
            Cancel
          </button>
        )}

        <button
          onClick={() => load().catch((e) => setError(e.message))}
          disabled={busy}
          style={{ padding: "10px 14px" }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 12, padding: 10, border: "1px solid #f99" }}>
          <b>Error:</b> {error}
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }} border={1} cellPadding={10}>
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th style={{ width: 220 }}>Name</th>
              <th>Note</th>
              <th style={{ width: 220 }}>Created</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td>{x.id}</td>
                <td>{x.name}</td>
                <td>{x.note ?? ""}</td>
                <td>{new Date(x.created_at).toLocaleString()}</td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => startEdit(x)} disabled={busy}>
                      Edit
                    </button>
                    <button onClick={() => remove(x.id)} disabled={busy}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center" }}>
                  No records yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 12, opacity: 0.8 }}>
        Visit: <code>/test-items</code>
      </p>
    </div>
  );
}
