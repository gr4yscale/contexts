-- up
ALTER TABLE activities RENAME TO nodes;
ALTER TABLE nodes RENAME COLUMN activityId TO nodeId;

-- Rename activity_history table to node_history
ALTER TABLE activity_history RENAME TO node_history;

-- Update the node_history table to reference the new column name
ALTER TABLE node_history RENAME COLUMN current_activity_id TO current_node_id;
ALTER TABLE node_history RENAME COLUMN previous_activity_id TO previous_node_id;

-- Drop and recreate foreign key constraints with new names
ALTER TABLE node_history DROP CONSTRAINT activity_history_current_activity_fk;
ALTER TABLE node_history DROP CONSTRAINT activity_history_previous_activity_fk;

ALTER TABLE node_history ADD CONSTRAINT node_history_current_node_fk 
    FOREIGN KEY (current_node_id) REFERENCES nodes(nodeId) ON DELETE CASCADE;
ALTER TABLE node_history ADD CONSTRAINT node_history_previous_node_fk 
    FOREIGN KEY (previous_node_id) REFERENCES nodes(nodeId) ON DELETE SET NULL;

-- Rename the index as well
DROP INDEX idx_activity_history_timestamp;
CREATE INDEX idx_node_history_timestamp ON node_history(timestamp);

-- down
-- Rename the index back
DROP INDEX idx_node_history_timestamp;
CREATE INDEX idx_activity_history_timestamp ON node_history(timestamp);

-- Recreate original foreign key constraints
ALTER TABLE node_history DROP CONSTRAINT node_history_current_node_fk;
ALTER TABLE node_history DROP CONSTRAINT node_history_previous_node_fk;

ALTER TABLE node_history ADD CONSTRAINT activity_history_current_activity_fk 
    FOREIGN KEY (current_node_id) REFERENCES nodes(nodeId) ON DELETE CASCADE;
ALTER TABLE node_history ADD CONSTRAINT activity_history_previous_activity_fk 
    FOREIGN KEY (previous_node_id) REFERENCES nodes(nodeId) ON DELETE SET NULL;

-- Rename columns back
ALTER TABLE node_history RENAME COLUMN current_node_id TO current_activity_id;
ALTER TABLE node_history RENAME COLUMN previous_node_id TO previous_activity_id;

-- Rename table back
ALTER TABLE node_history RENAME TO activity_history;

-- Rename table and column back
ALTER TABLE nodes RENAME COLUMN nodeId TO activityId;
ALTER TABLE nodes RENAME TO activities;
