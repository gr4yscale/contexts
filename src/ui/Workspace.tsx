import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";
import { getAllWorkspaces, WorkspaceDTO } from "../models/workspace.mts";
import {
  createWorkspaceForCurrentActivity,
  viewWorkspace,
} from "../workspaces.mts";
import ActionList from "./common/ActionList.tsx";
import { key, KeymapConfig } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";
import { Item } from "./common/useActionList.mts";

type WorkspaceItem = { id: string; display: string; data: WorkspaceDTO };
type WorkspaceStates = "initial" | "find" | "selectForSwitching";

const Workspace: React.FC = () => {
  const [mode, setMode] = useState<WorkspaceStates>("find");
  const [items, setItems] = useState<Array<WorkspaceItem>>([]);
  const [loading, setLoading] = useState(true);

  const itemActionKeymap = (item: Item): KeymapConfig => [
    {
      sequence: [key("o")],
      description: "Item action: Open",
      name: "item-action-open",
      handler: async () => {
        const workspace = item.data as WorkspaceDTO; //TOFIX casting
        viewWorkspace(workspace.id);
        console.log(`open ${item.display}`);
      },
    },

    {
      sequence: [key("\r", "return")],
      description: "Item action: default",
      name: "item-action-default",
      handler: () => {},
    },
    {
      sequence: [key(" ")],
      description: "Item action: handy keybind",
      name: "item-act-handy",
      handler: () => {},
    },
  ];

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
  }, []);

  const { keymap }: any = useContext(KeysContext);

  useEffect(() => {
    let keymapConfig: KeymapConfig = [];

    switch (mode) {
      case "initial":
        keymapConfig = [
          {
            sequence: [key("n")],
            description: "New workspace for current activity",
            name: "workspace-create-for-current-acctivity",
            handler: createWorkspaceForCurrentActivity,
          },
          {
            sequence: [key("d")],
            description: "Destroy current workspace",
            name: "destroy-current-workspace",
            handler: () => {
              console.log("destroy workspace");
            },
          },
          {
            sequence: [key("r")],
            description: "Rename current workspace",
            name: "rename-current-workspace",
            handler: () => {
              console.log("rename workspace");
            },
          },
          {
            sequence: [key("x")],
            description: "Filter workspace goto list",
            name: "filter-workspace-goto-list",
            handler: () => {
              console.log("filter workspace");
            },
          },
          // {
          //   sequence: [key("g")],
          //   description: "Go to workspace",
          //   name: "goto-workspace",
          //   handler: () => {
          //     setMode("find");
          //     keymap.popKeymap();
          //   },
          // },
        ];
        break;

      case "find":
        keymapConfig = [
          {
            sequence: [key("z")],
            description: "Initial mode",
            name: "set-mode-initial",
            handler: () => {
              setMode("initial");
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
    <Box flexDirection="column">
      <Text>mode: {mode}</Text>
      {mode === "find" && (
        <ActionList initialItems={items} actionKeymap={itemActionKeymap} />
      )}
    </Box>
  );
};

export default Workspace;

// TOFIX: implement loading

// {loading ? (
//   <Text>Loading...</Text>
// ) : (
//   <ActionList
//     initialItems={items}
//   />
// )}
