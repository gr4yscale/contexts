-- up
ALTER TABLE activities 
ADD COLUMN parent_id VARCHAR NULL REFERENCES activities(activityId);

CREATE INDEX idx_activities_parent_id ON activities(parent_id);

-- down
DROP INDEX IF EXISTS idx_activities_parent_id;
ALTER TABLE activities DROP COLUMN parent_id;
