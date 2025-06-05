-- Remove deprecated fields from nodes table
-- Migration 014: Remove active, orgId, and orgText fields

-- up
ALTER TABLE nodes DROP COLUMN IF EXISTS active;
ALTER TABLE nodes DROP COLUMN IF EXISTS orgid;
ALTER TABLE nodes DROP COLUMN IF EXISTS orgtext;

-- down
ALTER TABLE nodes ADD COLUMN active BOOLEAN DEFAULT true;
ALTER TABLE nodes ADD COLUMN orgid TEXT DEFAULT '';
ALTER TABLE nodes ADD COLUMN orgtext TEXT DEFAULT '';
