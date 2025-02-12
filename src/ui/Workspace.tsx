import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";
import { getAllWorkspaces, WorkspaceDTO } from "../models/workspace.mts";
import SelectionList from "./common/SelectionList.tsx";
import { key, KeymapConfig } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";

type WorkspaceStates = "initial" | "find" | "selectForSwitching";
type WorkspaceItem = { id: string; display: string; data: WorkspaceDTO };

const Workspace: React.FC = () => {
  const [mode, setMode] = useState<WorkspaceStates>("initial");
  const [items, setItems] = useState<Array<WorkspaceItem>>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = async () => {
    try {
      const workspaces = await getAllWorkspaces();
      const newItems = workspaces.map((workspace) => ({
        id: workspace.id.toString(),
        display: `${workspace.name} - ${
          workspace.activityName || "No activity associated"
        }`,
        data: workspace,
      }));
      setItems(newItems);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []); // also depends on mode?

  const { keymap }: any = useContext(KeysContext);

  useEffect(() => {
    let keymapConfig: KeymapConfig = [];

    switch (mode) {
      case "initial":
        keymapConfig = [
          {
            sequence: [key("g")],
            description: "Go to workspace",
            command: {
              name: "goto-workspace",
              handler: () => {
                //keymap.popKeymap();
                setMode("find");
              },
            },
          },
          {
            sequence: [key("x")],
            description: "Filter workspace goto list",
            command: {
              name: "filter-workspace-goto-list",
              handler: () => {
                console.log("filter workspace");
              },
            },
          },
          {
            sequence: [key("s")],
            description: "Select for switching",
            command: {
              name: "select-workspace-for-switching",
              handler: () => {
                setMode("selectForSwitching");
              },
            },
          },
          {
            sequence: [key("n")],
            description: "New workspace for current activity",
            command: {
              name: "new-workspace-for-current-acctivity",
              handler: () => {
                console.log("create new workspace");
              },
            },
          },
          {
            sequence: [key("d")],
            description: "Destroy current workspace",
            command: {
              name: "destroy-current-workspace",
              handler: () => {
                console.log("destroy workspace");
              },
            },
          },
          {
            sequence: [key("r")],
            description: "Rename current workspace",
            command: {
              name: "rename-current-workspace",
              handler: () => {
                console.log("rename workspace");
              },
            },
          },
        ];
        break;

      case "find":
        keymapConfig = [
          {
            sequence: [key("z")],
            description: "Initial mode",
            command: {
              name: "set-mode-initial",
              handler: () => {
                setMode("initial");
              },
            },
          },
        ];
        break;
    }

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [mode]);

  return (
    <Box>
      <Text>mode: {mode}</Text>
      {mode === "find" && (
        <SelectionList
          initialItems={items}
          onSelected={async (items) => {
            const workspaces = items.map((item) => item.data);
            console.log("Selected workspaces:", workspaces);
          }}
        />
      )}
    </Box>
  );
};

export default Workspace;

// TOFIX: implement loading

// {loading ? (
//   <Text>Loading...</Text>
// ) : (
//   <SelectionList
//     initialItems={items}
//   />
// )}
