import { $ } from "zx";
import React, { useEffect, useState } from "react";
import { Box } from "ink";
import CoreList, { List } from "./common/CoreList.tsx";
import { contextActivityTree } from "../models/activity.mts";

const Testbed: React.FC = () => {
  const [lists, setLists] = useState<Array<List>>([]);

  const fetchActivities = async () => {
    try {
      const tree = await contextActivityTree();

      const items = tree.map((activity) => ({
        id: activity.activityId,
        activity,
        selected: activity.selected,
        display:
          "  ".repeat(activity.depth || 0) +
          (activity.depth || 0 > 0 ? "└─ " : "") +
          activity.name,
      }));
      setLists([{ items, id: "default", display: "default" }]);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <Box flexDirection="column" width="100%">
      <CoreList
        lists={lists}
        multiple={true}
        onSelected={(items) => {
          $`notify-send items: "${items}"`;
        }}
      />
    </Box>
  );
};

export default Testbed;
