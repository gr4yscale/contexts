-- Remove deprecated parent_id column from nodes table
-- Migration 015: Remove parent_id column since we now use node_relationships table

-- up
ALTER TABLE nodes DROP COLUMN IF EXISTS parent_id;

-- down
ALTER TABLE nodes ADD COLUMN parent_id TEXT;
