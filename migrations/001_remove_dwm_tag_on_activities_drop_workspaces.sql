-- up
-- Drop the workspaces table first since it has a foreign key to activities
DROP TABLE IF EXISTS workspaces;

-- Alter activities table to drop dwmTag column
ALTER TABLE activities DROP COLUMN IF EXISTS dwmTag;

-- Recreate workspaces table with original schema
CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY DEFAULT nextval('workspace_id_seq'),
    activityId VARCHAR NULL,
    name VARCHAR NULL,
    FOREIGN KEY (activityId) REFERENCES activities(activityId)
);

-- down
-- Drop the new workspaces table
DROP TABLE IF EXISTS workspaces;

-- Add back the dwmTag column to activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS dwmTag INTEGER;

-- Recreate the original workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY DEFAULT nextval('workspace_id_seq'),
    activityId VARCHAR NULL,
    name VARCHAR NULL,
    FOREIGN KEY (activityId) REFERENCES activities(activityId)
);
