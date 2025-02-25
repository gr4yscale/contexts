-- up

-- Create sequence for workspace IDs
-- 1-29 is the index range of tags in my dwm setup which
-- are available to allocate dynamically.
-- 0 is reserved for the TUI of this program
-- trying to view indexes above 29 using my dwm build's IPC interface fails
-- this seems arbitrary but is likely due to how I've patched dwm; will investigate

CREATE SEQUENCE IF NOT EXISTS workspace_id_seq
    START 1
    INCREMENT 1
    MAXVALUE 29
    CYCLE;

-- These are basically "slots" which we allocate for an Activity
-- Their id represents the index of a "tag" in `dwm`, my tiling window manager of choice
-- dwm represents tags as a 32-bit bitmask, so workspace id is the index of the bit

CREATE TABLE IF NOT EXISTS workspaces (
    id INTEGER PRIMARY KEY DEFAULT nextval('workspace_id_seq'),
    activityId VARCHAR NULL,
    name VARCHAR NULL,
    FOREIGN KEY (activityId) REFERENCES activities(activityId)
);

-- down
DROP TABLE IF EXISTS workspaces;
DROP SEQUENCE IF EXISTS workspace_id_seq;
