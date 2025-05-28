-- up

-- Rename activityId column to nodeId in workspaces table
ALTER TABLE workspaces RENAME COLUMN activityId TO nodeId;

-- Update foreign key constraint
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_activityid_fkey;
ALTER TABLE workspaces ADD CONSTRAINT workspaces_nodeid_fkey
    FOREIGN KEY (nodeId) REFERENCES nodes(nodeId) ON DELETE CASCADE;

-- down

-- Restore foreign key constraint
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_nodeid_fkey;
ALTER TABLE workspaces ADD CONSTRAINT workspaces_activityid_fkey
    FOREIGN KEY (activityId) REFERENCES activities(activityId) ON DELETE CASCADE;

-- Rename back to original name
ALTER TABLE workspaces RENAME COLUMN nodeId TO activityId;
