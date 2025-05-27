import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";
import {
  getAllWorkspaces,
  updateWorkspace,
  WorkspaceDTO,
} from "../models/workspace.mts";
import {
  viewNextWorkspaceForCurrentNode,
  viewPreviousWorkspaceForCurrentNode,
  viewWorkspace,
  deleteCurrentWorkspace,
  getCurrentWorkspace,
} from "../workspaces.mts";

import ActionList from "./common/ActionList.tsx";

import { key, KeymapConfig } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";
import { Item } from "./common/useActionList.mts";
import TextInput from "./TextInput.tsx";

type WorkspaceItem = { id: string; display: string; data: WorkspaceDTO };
type WorkspaceStates = "initial" | "find" | "workspaceRename";

const Workspace: React.FC = () => {
  const [mode, setMode] = useState<WorkspaceStates>("initial");
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
            sequence: [key("g")],
            description: "Go to workpace list",
            name: "workspace-list-show",
            handler: () => {
              setMode("find");
              keymap.popKeymap();
            },
          },
          // {
          //   sequence: [key("n")],
          //   description: "New workspace for current activity",
          //   name: "workspace-create-for-current-acctivity",
          //   handler: () => {
          //     //setMode("workspaceCreate");
          //     keymap.popKeymap();
          //   },
          // },
          {
            sequence: [key("d")],
            description: "Destroy current workspace",
            name: "destroy-current-workspace",
            handler: deleteCurrentWorkspace,
          },
          {
            sequence: [key("r")],
            description: "Rename current workspace",
            name: "rename-current-workspace",
            handler: () => {
              setMode("workspaceRename");
              keymap.popKeymap();
            },
          },
          {
            sequence: [key("j")],
            description: "Next workspace for current activity",
            name: "workspace-next-for-current-activity",
            handler: viewNextWorkspaceForCurrentNode,
          },
          {
            sequence: [key("k")],
            description: "Prev workspace for current activity",
            name: "workspace-prev-for-current-activity",
            handler: viewPreviousWorkspaceForCurrentNode,
          },
          {
            sequence: [key("x")],
            description: "Filter workspace goto list",
            name: "filter-workspace-goto-list",
            handler: () => {
              console.log("filter workspace");
            },
          },
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

      {mode === "workspaceRename" && (
        <TextInput
          callback={async (name: string) => {
            if (name === "") return; // TODO validation
            const workspace = await getCurrentWorkspace();
            if (workspace) {
              updateWorkspace({
                id: workspace.id,
                name,
              });
            }
            setMode("initial");
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
//   <ActionList
//     initialItems={items}
//   />
// )}
