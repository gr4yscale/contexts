import { useState, useEffect } from "react";
import { Activity } from "../../types.mts";
import { getCurrentNode } from "../../models/activity.mts";

export const useCurrentNode = () => {
  const [currentNode, setCurrentNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentNode = async () => {
    try {
      const activity = await getCurrentNode();
      setCurrentNode(activity);
    } catch (error) {
      console.error("Error fetching current activity:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentNode();
  }, []);

  return { currentNode, loading, fetchCurrentNode };
};
