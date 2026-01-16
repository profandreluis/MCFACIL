-- Rollback for migration 3

DROP INDEX IF EXISTS idx_teachers_name;
DROP TABLE IF EXISTS teachers;
