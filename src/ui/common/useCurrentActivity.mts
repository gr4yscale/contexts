import { useState, useEffect } from "react";
import { Activity } from "../../types.mts";
import { getCurrentActivity } from "../../models/activity.mts";

export const useCurrentActivity = () => {
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentActivity = async () => {
    try {
      const activity = await getCurrentActivity();
      setCurrentActivity(activity);
    } catch (error) {
      console.error("Error fetching current activity:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentActivity();
  }, []);

  return { currentActivity, loading, fetchCurrentActivity };
};
