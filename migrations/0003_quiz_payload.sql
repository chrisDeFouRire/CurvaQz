-- D1 migration: store quiz payload for replay/sharing

ALTER TABLE quizzes ADD COLUMN payload TEXT NULL;
