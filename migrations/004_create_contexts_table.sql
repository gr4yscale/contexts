-- up
CREATE TABLE IF NOT EXISTS contexts (
    id SERIAL PRIMARY KEY,
    context_id VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table to handle many-to-many relationship between contexts and activities
CREATE TABLE IF NOT EXISTS context_activities (
    id SERIAL PRIMARY KEY,
    context_id VARCHAR NOT NULL,
    activity_id VARCHAR NOT NULL,
    FOREIGN KEY (context_id) REFERENCES contexts(context_id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(activityId) ON DELETE CASCADE,
    UNIQUE(context_id, activity_id)
);

-- down
DROP TABLE IF EXISTS context_activities;
DROP TABLE IF EXISTS contexts;
