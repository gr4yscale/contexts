-- up

-- Rename activities table to nodes
ALTER TABLE activities RENAME TO nodes;

-- Rename activityId column to nodeId in nodes table
ALTER TABLE nodes RENAME COLUMN activityId TO nodeId;

-- Update workspaces table foreign key column name
ALTER TABLE workspaces RENAME COLUMN activityId TO nodeId;

-- Rename context_activities table to context_nodes
ALTER TABLE context_activities RENAME TO context_nodes;

-- Rename activity_id column to node_id in context_nodes table
ALTER TABLE context_nodes RENAME COLUMN activity_id TO node_id;

-- Rename activity_history table to node_history
ALTER TABLE activity_history RENAME TO node_history;

-- Rename columns in node_history table
ALTER TABLE node_history RENAME COLUMN current_activity_id TO current_node_id;
ALTER TABLE node_history RENAME COLUMN previous_activity_id TO previous_node_id;

-- Update foreign key constraint names to reflect new table/column names
-- Drop old constraints
ALTER TABLE node_history DROP CONSTRAINT IF EXISTS activity_history_current_activity_fk;
ALTER TABLE node_history DROP CONSTRAINT IF EXISTS activity_history_previous_activity_fk;

-- Add new constraints with updated names
ALTER TABLE node_history ADD CONSTRAINT node_history_current_node_fk 
    FOREIGN KEY (current_node_id) REFERENCES nodes(nodeId) ON DELETE CASCADE;
ALTER TABLE node_history ADD CONSTRAINT node_history_previous_node_fk 
    FOREIGN KEY (previous_node_id) REFERENCES nodes(nodeId) ON DELETE SET NULL;

-- Update context_nodes foreign key constraint
ALTER TABLE context_nodes DROP CONSTRAINT IF EXISTS context_activities_activity_id_fkey;
ALTER TABLE context_nodes ADD CONSTRAINT context_nodes_node_id_fkey
    FOREIGN KEY (node_id) REFERENCES nodes(nodeId) ON DELETE CASCADE;

-- Update workspaces foreign key constraint
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_activityId_fkey;
ALTER TABLE workspaces ADD CONSTRAINT workspaces_nodeId_fkey
    FOREIGN KEY (nodeId) REFERENCES nodes(nodeId);

-- down

-- Restore workspaces foreign key constraint
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_nodeId_fkey;
ALTER TABLE workspaces ADD CONSTRAINT workspaces_activityId_fkey
    FOREIGN KEY (activityId) REFERENCES activities(activityId);

-- Restore context_nodes foreign key constraint (note: table is still context_nodes at this point)
ALTER TABLE context_nodes DROP CONSTRAINT IF EXISTS context_nodes_node_id_fkey;
ALTER TABLE context_activities ADD CONSTRAINT context_activities_activity_id_fkey
    FOREIGN KEY (activity_id) REFERENCES activities(activityId) ON DELETE CASCADE;

-- Restore node_history foreign key constraints (note: table is still node_history at this point)
ALTER TABLE node_history DROP CONSTRAINT IF EXISTS node_history_current_node_fk;
ALTER TABLE node_history DROP CONSTRAINT IF EXISTS node_history_previous_node_fk;
ALTER TABLE activity_history ADD CONSTRAINT activity_history_current_activity_fk 
    FOREIGN KEY (current_activity_id) REFERENCES activities(activityId) ON DELETE CASCADE;
ALTER TABLE activity_history ADD CONSTRAINT activity_history_previous_activity_fk 
    FOREIGN KEY (previous_activity_id) REFERENCES activities(activityId) ON DELETE SET NULL;

-- Rename back to original names (in reverse order of up migration)
ALTER TABLE node_history RENAME COLUMN current_node_id TO current_activity_id;
ALTER TABLE node_history RENAME COLUMN previous_node_id TO previous_activity_id;

ALTER TABLE node_history RENAME TO activity_history;

ALTER TABLE context_nodes RENAME COLUMN node_id TO activity_id;

ALTER TABLE context_nodes RENAME TO context_activities;

ALTER TABLE workspaces RENAME COLUMN nodeId TO activityId;

ALTER TABLE nodes RENAME COLUMN nodeId TO activityId;

ALTER TABLE nodes RENAME TO activities;
