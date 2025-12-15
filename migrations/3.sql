-- Migration 3: create teachers table

CREATE TABLE teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  profile_photo_url TEXT,
  subjects TEXT, -- JSON array
  yearly_goals TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teachers_name ON teachers(name);
