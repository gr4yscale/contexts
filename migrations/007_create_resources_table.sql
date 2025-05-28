-- Created: 2025-05-15

CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- Corresponds to ResourceType enum values
    created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add an index on the 'type' column for faster querying by resource type
CREATE INDEX idx_resources_type ON resources(type);

-- Add an index on 'last_accessed' for sorting or filtering by recency
CREATE INDEX idx_resources_last_accessed ON resources(last_accessed DESC);

-- Optional: Add a unique constraint on 'url' if URLs should be globally unique across all resources.
-- This might be too restrictive if different resource types could legitimately share a URL
-- (e.g., an org_note and a web_link pointing to the same file/page but representing different aspects).
-- Consider if uniqueness should be per type or global. For now, not adding a global unique constraint on URL.
-- Example: ALTER TABLE resources ADD CONSTRAINT uq_resource_url UNIQUE (url);

COMMENT ON TABLE resources IS 'Stores various types of resources like web links, documents, contacts, etc.';
COMMENT ON COLUMN resources.id IS 'Unique identifier for the resource.';
COMMENT ON COLUMN resources.name IS 'User-defined name for the resource.';
COMMENT ON COLUMN resources.url IS 'The primary Uniform Resource Locator or identifier for the resource.';
COMMENT ON COLUMN resources.type IS 'Type of the resource (e.g., web_link, org_note, llm_convo). Corresponds to ResourceType enum in code.';
COMMENT ON COLUMN resources.created IS 'Timestamp of when the resource was created.';
COMMENT ON COLUMN resources.last_accessed IS 'Timestamp of when the resource was last accessed or used.';

-- down
