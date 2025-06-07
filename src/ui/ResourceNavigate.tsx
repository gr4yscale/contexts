import React, { useEffect, useState, useContext } from "react";
import { Box, Text } from "ink";

import { Resource, ResourceType } from "../models/resource.mts";
import { getResourcesByType } from "../models/resource.mts";
import { executeAction } from "../actions.mts";
import * as logger from "../logger.mts";

import { KeymapConfig, key } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";

import CoreList, { List, ListItem } from "./common/CoreList.tsx";
import useListSwitching from "./common/useListSwitching.mts";

export type Modes = "lists" | "items";

const ResourceNavigate: React.FC = () => {
  const [mode, setMode] = useState<Modes>("items");

  const [lists, setLists] = useState<Array<List>>([]);

  const { currentListItems, currentListIndex, switchListByIndex, switchListById } =
    useListSwitching(lists);

  const [loading, setLoading] = useState(true);

  const fetchResources = async () => {
    try {
      const linkResources = await getResourcesByType(ResourceType.LINK);
      const pdfResources = await getResourcesByType(ResourceType.PDF);

      const sortedLinkResources = [...linkResources].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      const sortedPdfResources = [...pdfResources].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      logger.debug("Fetched link resources:", sortedLinkResources);
      logger.debug("Fetched PDF resources:", sortedPdfResources);

      const formattedLinkResources = sortedLinkResources.map((resource) => ({
        id: resource.id,
        display: resource.name,
        data: resource,
      }));

      const formattedPdfResources = sortedPdfResources.map((resource) => ({
        id: resource.id,
        display: resource.name,
        data: resource,
      }));

      setLists([
        {
          id: "links",
          display: "Link Resources",
          items: formattedLinkResources,
        },
        {
          id: "pdfs",
          display: "PDF Resources",
          items: formattedPdfResources,
        },
      ]);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // keymapping
  const { keymap } = useContext(KeysContext);

  // shared keymap
  useEffect(() => {
    keymap.pushKeymap([
      {
        sequence: [key("`")],
        description: "Toggle List/Items",
        name: "toggle-list-or-items",
        handler: () => {
          if (mode === "lists") {
            setMode("items");
          } else {
            setMode("lists");
          }
        },
        hidden: true,
      },
      {
        sequence: [key("{")],
        description: "Previous list",
        name: "prevList",
        handler: () => {
          switchListByIndex(currentListIndex - 1);
        },
      },
      {
        sequence: [key("}")],
        description: "Next list",
        name: "nextList",
        handler: () => {
          switchListByIndex(currentListIndex + 1);
        },
      },
    ]);

    return () => {
      keymap.popKeymap();
    };
  }, []);

  return (
    <Box borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading resources...</Text>
      ) : mode === "items" ? (
        <CoreList
          items={currentListItems}
          onSelected={(selectedItems: ListItem[]) => {
            if (selectedItems.length > 0) {
              const selectedItem = selectedItems[0];
              const resource = selectedItem.data as Resource;
              if (resource && resource.id) {
                executeAction("activateResource", resource.id);
              } else {
                console.error(
                  "Selected item data is not a valid Resource:",
                  selectedItem
                );
              }
            }
          }}
          multiple={false}
          initialMode="select"
        />
      ) : (
        <CoreList
          items={lists}
          onSelected={(selectedLists: List[]) => {
            if (selectedLists.length > 0) {
              const selectedList = selectedLists[0];
              switchListById(selectedList.id);
              setMode("items");
            }
          }}
          multiple={false}
          initialMode="select"
        />
      )}
    </Box>
  );
};

export default ResourceNavigate;
