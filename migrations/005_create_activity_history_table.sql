-- up
CREATE TABLE activity_history (
    id SERIAL PRIMARY KEY,
    current_activity_id TEXT NOT NULL,
    previous_activity_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT activity_history_current_activity_fk FOREIGN KEY (current_activity_id) 
        REFERENCES activities(activityId) ON DELETE CASCADE,
    CONSTRAINT activity_history_previous_activity_fk FOREIGN KEY (previous_activity_id) 
        REFERENCES activities(activityId) ON DELETE SET NULL
);

-- Create an index for faster lookups
CREATE INDEX idx_activity_history_timestamp ON activity_history(timestamp);

-- Insert a default record if needed (can be empty)
INSERT INTO activity_history (current_activity_id, previous_activity_id)
SELECT a.activityId, NULL
FROM activities a
ORDER BY a.lastAccessed DESC
LIMIT 1;

-- down
DROP TABLE IF EXISTS activity_history;
