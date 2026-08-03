import type BetterSqlite3 from "better-sqlite3";

/**
 * Idempotent DDL, applied at startup. The FTS5 virtual table and its sync
 * triggers are hand-written SQL by design: ORMs cannot model virtual tables,
 * and keeping them here (versus generated migrations) means one source of
 * truth for the search contract.
 */
export function migrate(db: BetterSqlite3.Database): void {
  // Fail loudly at boot if this SQLite build lacks FTS5.
  try {
    db.exec(
      "CREATE VIRTUAL TABLE IF NOT EXISTS temp.__fts5_probe USING fts5(x); DROP TABLE temp.__fts5_probe;",
    );
  } catch {
    throw new Error(
      "This better-sqlite3 build does not support FTS5 (required for search). Reinstall with `npm rebuild better-sqlite3`.",
    );
  }

  db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS contacts (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  photo_path   TEXT,
  company      TEXT,
  role         TEXT,
  industry     TEXT,
  city         TEXT,
  email        TEXT,
  phone        TEXT,
  linkedin_url TEXT,
  how_we_met   TEXT,
  tier         TEXT NOT NULL DEFAULT 'new',
  cadence_days INTEGER,
  birthday     TEXT,
  notes        TEXT,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_tier ON contacts(user_id, tier);
CREATE INDEX IF NOT EXISTS idx_contacts_user_email ON contacts(user_id, email);

CREATE TABLE IF NOT EXISTS tags (
  id      TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name    TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tags_user_name ON tags(user_id, name);

CREATE TABLE IF NOT EXISTS contact_tags (
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id     TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, tag_id)
);

CREATE TABLE IF NOT EXISTS important_dates (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  date       TEXT NOT NULL,
  recurring  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_dates_user ON important_dates(user_id);

CREATE TABLE IF NOT EXISTS interactions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  date       TEXT NOT NULL,
  notes      TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_date ON interactions(contact_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_user_date ON interactions(user_id, date DESC);

CREATE TABLE IF NOT EXISTS voice_notes (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id   TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  file_path    TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  duration_sec REAL,
  transcript   TEXT,
  created_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_voice_contact ON voice_notes(contact_id);

CREATE TABLE IF NOT EXISTS pipeline_items (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  stage      TEXT NOT NULL,
  note       TEXT,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pipeline_user_contact ON pipeline_items(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_user_stage ON pipeline_items(user_id, stage, position);

CREATE TABLE IF NOT EXISTS tasks (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id   TEXT REFERENCES contacts(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  due_date     TEXT,
  completed_at INTEGER,
  created_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(user_id, due_date);

CREATE TABLE IF NOT EXISTS intros (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL,
  from_contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  to_contact_id   TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  date            TEXT,
  note            TEXT,
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_intros_from ON intros(from_contact_id);
CREATE INDEX IF NOT EXISTS idx_intros_to ON intros(to_contact_id);

CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  title,
  body,
  entity_type UNINDEXED,
  entity_id   UNINDEXED,
  user_id     UNINDEXED,
  tokenize = 'unicode61 remove_diacritics 2',
  prefix = '2 3 4'
);
`);

  // --- FTS sync triggers -----------------------------------------------------
  // The searchable "body" of a contact concatenates its descriptive fields.
  const contactBody = `coalesce(new.company,'')||' '||coalesce(new.role,'')||' '||coalesce(new.industry,'')||' '||coalesce(new.city,'')||' '||coalesce(new.how_we_met,'')||' '||coalesce(new.email,'')||' '||coalesce(new.notes,'')`;

  db.exec(`
CREATE TRIGGER IF NOT EXISTS contacts_fts_ai AFTER INSERT ON contacts BEGIN
  INSERT INTO search_index(title, body, entity_type, entity_id, user_id)
  VALUES (new.name, ${contactBody}, 'contact', new.id, new.user_id);
END;
CREATE TRIGGER IF NOT EXISTS contacts_fts_au AFTER UPDATE ON contacts BEGIN
  DELETE FROM search_index WHERE entity_type='contact' AND entity_id=old.id;
  INSERT INTO search_index(title, body, entity_type, entity_id, user_id)
  VALUES (new.name, ${contactBody}, 'contact', new.id, new.user_id);
END;
CREATE TRIGGER IF NOT EXISTS contacts_fts_ad AFTER DELETE ON contacts BEGIN
  DELETE FROM search_index WHERE entity_type='contact' AND entity_id=old.id;
END;

CREATE TRIGGER IF NOT EXISTS interactions_fts_ai AFTER INSERT ON interactions BEGIN
  INSERT INTO search_index(title, body, entity_type, entity_id, user_id)
  VALUES (new.type, coalesce(new.notes,''), 'interaction', new.id, new.user_id);
END;
CREATE TRIGGER IF NOT EXISTS interactions_fts_au AFTER UPDATE ON interactions BEGIN
  DELETE FROM search_index WHERE entity_type='interaction' AND entity_id=old.id;
  INSERT INTO search_index(title, body, entity_type, entity_id, user_id)
  VALUES (new.type, coalesce(new.notes,''), 'interaction', new.id, new.user_id);
END;
CREATE TRIGGER IF NOT EXISTS interactions_fts_ad AFTER DELETE ON interactions BEGIN
  DELETE FROM search_index WHERE entity_type='interaction' AND entity_id=old.id;
END;

CREATE TRIGGER IF NOT EXISTS voice_fts_ai AFTER INSERT ON voice_notes BEGIN
  INSERT INTO search_index(title, body, entity_type, entity_id, user_id)
  VALUES ('voice note', coalesce(new.transcript,''), 'voice_note', new.id, new.user_id);
END;
CREATE TRIGGER IF NOT EXISTS voice_fts_au AFTER UPDATE ON voice_notes BEGIN
  DELETE FROM search_index WHERE entity_type='voice_note' AND entity_id=old.id;
  INSERT INTO search_index(title, body, entity_type, entity_id, user_id)
  VALUES ('voice note', coalesce(new.transcript,''), 'voice_note', new.id, new.user_id);
END;
CREATE TRIGGER IF NOT EXISTS voice_fts_ad AFTER DELETE ON voice_notes BEGIN
  DELETE FROM search_index WHERE entity_type='voice_note' AND entity_id=old.id;
END;

CREATE TRIGGER IF NOT EXISTS tasks_fts_ai AFTER INSERT ON tasks BEGIN
  INSERT INTO search_index(title, body, entity_type, entity_id, user_id)
  VALUES (new.title, '', 'task', new.id, new.user_id);
END;
CREATE TRIGGER IF NOT EXISTS tasks_fts_au AFTER UPDATE ON tasks BEGIN
  DELETE FROM search_index WHERE entity_type='task' AND entity_id=old.id;
  INSERT INTO search_index(title, body, entity_type, entity_id, user_id)
  VALUES (new.title, '', 'task', new.id, new.user_id);
END;
CREATE TRIGGER IF NOT EXISTS tasks_fts_ad AFTER DELETE ON tasks BEGIN
  DELETE FROM search_index WHERE entity_type='task' AND entity_id=old.id;
END;
`);
}
