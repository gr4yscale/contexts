import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import CoreList, { ListItem } from "./common/CoreList.tsx";
import { getBrowserStateForCurrentNode } from "../browser.mts";
import { isTabActive } from "../browser.mts";
import { executeAction } from "../actions.mts";

const CurrentNodeBrowserState: React.FC = () => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nodeName, setNodeName] = useState<string>("");

  const fetchBrowserState = async () => {
    setLoading(true);
    try {
      const browserState = await getBrowserStateForCurrentNode();
      
      if (!browserState) {
        setItems([]);
        setNodeName("No current node");
        return;
      }

      // Create items for each window and its tabs
      const newItems: ListItem[] = [];
      
      for (const [windowIndex, window] of browserState.windows.entries()) {
        // Add window header
        newItems.push({
          id: `window-${windowIndex}`,
          display: `Window: ${window.title} (${window.tabs.length} tabs)`,
          data: { type: 'window', window },
        });

        // Add tabs for this window
        for (const [tabIndex, tab] of window.tabs.entries()) {
          const isActive = await isTabActive(tab);
          const activePrefix = isActive ? "*** " : "";
          const truncatedTitle = tab.title.length > 80 ? tab.title.substring(0, 77) + '...' : tab.title;
          const truncatedUrl = tab.url.length > 80 ? tab.url.substring(0, 77) + '...' : tab.url;
          newItems.push({
            id: `window-${windowIndex}-tab-${tabIndex}`,
            display: `  └─ ${activePrefix}${truncatedTitle} - ${truncatedUrl}`,
            data: { type: 'tab', tab, window },
          });
        }
      }

      setItems(newItems);
      setNodeName("Current Node");
    } catch (error) {
      console.error("Error fetching browser state:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrowserState();
  }, []);

  return (
    <Box borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading browser state...</Text>
      ) : (
        <Box flexDirection="column">
          {items.length === 0 ? (
            <Text>No browser windows found for current node</Text>
          ) : (
            <CoreList
              items={items}
              multiple={false}
              initialMode="select"
              onSelected={async (selectedItems: ListItem[]) => {
                const selectedItem = selectedItems[0];
                if (selectedItem?.data?.type === 'tab') {
                  // Could implement tab navigation here
                  console.log("Selected tab:", selectedItem.data.tab);
                }
                // Return to node navigation
                await executeAction("nodeNavigate");
              }}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default CurrentNodeBrowserState;
