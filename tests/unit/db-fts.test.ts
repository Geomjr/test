import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { migrate } from "@/lib/db/migrate";

function freshDb() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  migrate(db);
  db.prepare(
    "INSERT INTO users (id, email, password_hash, name, created_at) VALUES ('u1','t@t.co','x','Test',0)",
  ).run();
  return db;
}

function insertContact(db: Database.Database, id: string, name: string, notes = "") {
  db.prepare(
    `INSERT INTO contacts (id, user_id, name, notes, tier, created_at, updated_at)
     VALUES (?, 'u1', ?, ?, 'new', 0, 0)`,
  ).run(id, name, notes);
}

describe("FTS5 search index triggers", () => {
  it("indexes contacts on insert and finds them via MATCH", () => {
    const db = freshDb();
    insertContact(db, "c1", "Priya Raman", "loves trail running in Patagonia");
    const hits = db
      .prepare("SELECT entity_id FROM search_index WHERE search_index MATCH ? AND user_id='u1'")
      .all('"patagonia"*') as { entity_id: string }[];
    expect(hits.map((h) => h.entity_id)).toEqual(["c1"]);
  });

  it("reindexes on update", () => {
    const db = freshDb();
    insertContact(db, "c1", "Priya Raman");
    db.prepare("UPDATE contacts SET name='Priya Raman-Lee' WHERE id='c1'").run();
    const rows = db
      .prepare("SELECT title FROM search_index WHERE entity_type='contact' AND entity_id='c1'")
      .all() as { title: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe("Priya Raman-Lee");
  });

  it("indexes interactions and cleans up on direct delete", () => {
    const db = freshDb();
    insertContact(db, "c1", "Priya Raman");
    db.prepare(
      `INSERT INTO interactions (id, user_id, contact_id, type, date, notes, created_at)
       VALUES ('i1','u1','c1','coffee','2026-08-01','talked about the Bain offer',0)`,
    ).run();
    expect(
      db.prepare("SELECT count(*) n FROM search_index WHERE entity_id='i1'").get(),
    ).toMatchObject({ n: 1 });

    db.prepare("DELETE FROM interactions WHERE id='i1'").run();
    expect(
      db.prepare("SELECT count(*) n FROM search_index WHERE entity_id='i1'").get(),
    ).toMatchObject({ n: 0 });
  });

  it("removes the contact's own index row when the contact is deleted", () => {
    const db = freshDb();
    insertContact(db, "c1", "Priya Raman");
    db.prepare("DELETE FROM contacts WHERE id='c1'").run();
    expect(
      db.prepare("SELECT count(*) n FROM search_index WHERE entity_id='c1'").get(),
    ).toMatchObject({ n: 0 });
  });

  it("documents cascade behavior: child rows are removed by FK cascade", () => {
    const db = freshDb();
    insertContact(db, "c1", "Priya Raman");
    db.prepare(
      `INSERT INTO interactions (id, user_id, contact_id, type, date, notes, created_at)
       VALUES ('i1','u1','c1','coffee','2026-08-01','notes',0)`,
    ).run();
    db.prepare("DELETE FROM contacts WHERE id='c1'").run();
    // The interaction row itself must be gone via ON DELETE CASCADE.
    expect(db.prepare("SELECT count(*) n FROM interactions").get()).toMatchObject({ n: 0 });
    // The app scrubs child search_index rows explicitly (see deleteContact) —
    // SQLite does not fire child-table triggers for FK cascade deletions.
  });
});
