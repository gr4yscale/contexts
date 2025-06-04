-- Created: 2025-06-04

-- Replace url column with data column in resources table
ALTER TABLE resources DROP COLUMN url;
ALTER TABLE resources ADD COLUMN data JSONB NOT NULL DEFAULT '{}';

-- Update the comment for the table and new column
COMMENT ON COLUMN resources.data IS 'JSON data containing resource-specific information (replaces the previous url column).';

-- down
ALTER TABLE resources DROP COLUMN data;
ALTER TABLE resources ADD COLUMN url TEXT NOT NULL DEFAULT '';
COMMENT ON COLUMN resources.url IS 'The primary Uniform Resource Locator or identifier for the resource.';
