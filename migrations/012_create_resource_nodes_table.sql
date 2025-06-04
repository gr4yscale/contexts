-- Created: 2025-06-04

CREATE TABLE resource_nodes (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    node_id VARCHAR NOT NULL REFERENCES nodes(nodeid) ON DELETE CASCADE,
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add unique constraint to prevent duplicate relationships
ALTER TABLE resource_nodes ADD CONSTRAINT uq_resource_node UNIQUE (resource_id, node_id);

-- Add indexes for efficient querying
CREATE INDEX idx_resource_nodes_resource_id ON resource_nodes(resource_id);
CREATE INDEX idx_resource_nodes_node_id ON resource_nodes(node_id);

COMMENT ON TABLE resource_nodes IS 'Join table establishing many-to-many relationship between resources and nodes.';
COMMENT ON COLUMN resource_nodes.id IS 'Unique identifier for the resource-node relationship.';
COMMENT ON COLUMN resource_nodes.resource_id IS 'Foreign key reference to resources table.';
COMMENT ON COLUMN resource_nodes.node_id IS 'Foreign key reference to nodes table.';
COMMENT ON COLUMN resource_nodes.created IS 'Timestamp of when the relationship was created.';

-- down
DROP TABLE IF EXISTS resource_nodes;
