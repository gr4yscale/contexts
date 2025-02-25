-- up
CREATE TABLE IF NOT EXISTS activities (
    activityId VARCHAR PRIMARY KEY,
    orgId VARCHAR NULL,
    orgText VARCHAR NULL,
    name VARCHAR,
    created TIMESTAMP,
    lastAccessed TIMESTAMP,
    active BOOLEAN
);

-- down
DROP TABLE IF EXISTS activities;
