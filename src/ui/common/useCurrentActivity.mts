import { useState, useEffect } from "react";
import { Node } from "../../types.mts";
import { getCurrentNode } from "../../models/node.mts";

export const useCurrentNode = () => {
  const [currentNode, setCurrentNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentNode = async () => {
    try {
      const node = await getCurrentNode();
      setCurrentNode(node);
    } catch (error) {
      console.error("Error fetching current node:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentNode();
  }, []);

  return { currentNode, loading, fetchCurrentNode };
};
