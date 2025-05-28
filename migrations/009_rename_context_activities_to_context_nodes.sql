-- up

-- Rename context_activities table to context_nodes
ALTER TABLE context_activities RENAME TO context_nodes;

-- Rename activity_id column to node_id in context_nodes table
ALTER TABLE context_nodes RENAME COLUMN activity_id TO node_id;

-- Update foreign key constraint
ALTER TABLE context_nodes DROP CONSTRAINT IF EXISTS context_activities_activity_id_fkey;
ALTER TABLE context_nodes ADD CONSTRAINT context_nodes_node_id_fkey
    FOREIGN KEY (node_id) REFERENCES nodes(nodeId) ON DELETE CASCADE;

-- down

-- Restore foreign key constraint
ALTER TABLE context_nodes DROP CONSTRAINT IF EXISTS context_nodes_node_id_fkey;
ALTER TABLE context_activities ADD CONSTRAINT context_activities_activity_id_fkey
    FOREIGN KEY (activity_id) REFERENCES activities(activityId) ON DELETE CASCADE;

-- Rename back to original names
ALTER TABLE context_nodes RENAME COLUMN node_id TO activity_id;
ALTER TABLE context_nodes RENAME TO context_activities;
