-- Migration to convert tree structure to DAG (Directed Acyclic Graph)
-- This allows nodes to have multiple parents

-- Create the node_relationships table for many-to-many parent-child relationships
CREATE TABLE node_relationships (
    id SERIAL PRIMARY KEY,
    parent_node_id TEXT NOT NULL,
    child_node_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_node_id) REFERENCES nodes(nodeId) ON DELETE CASCADE,
    FOREIGN KEY (child_node_id) REFERENCES nodes(nodeId) ON DELETE CASCADE,
    UNIQUE(parent_node_id, child_node_id)
);

-- Migrate existing parent-child relationships from nodes table to node_relationships table
INSERT INTO node_relationships (parent_node_id, child_node_id)
SELECT parent_id, nodeId 
FROM nodes 
WHERE parent_id IS NOT NULL;

-- Create index for performance
CREATE INDEX idx_node_relationships_parent ON node_relationships(parent_node_id);
CREATE INDEX idx_node_relationships_child ON node_relationships(child_node_id);

-- Remove the parent_id column from nodes table (we'll keep it for now for backward compatibility)
-- ALTER TABLE nodes DROP COLUMN parent_id;

-- down
-- Restore parent_id relationships back to nodes table
-- UPDATE nodes 
-- SET parent_id = (
--     SELECT parent_node_id 
--     FROM node_relationships 
--     WHERE child_node_id = nodes.nodeId 
--     LIMIT 1
-- );

-- DROP TABLE node_relationships;
