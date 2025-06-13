import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import { Box, Text } from "ink";

import { Node } from "../types.mts";
import { filteredNodeTree, NodeTreeFilter, formatNodeWithHierarchy, getChildNodes, getParentNodes, getFilteredRootNodes } from "../models/node.mts";
import * as logger from "../logger.mts";

import { KeymapConfig, key } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";

import CoreList, { List, ListItem } from "./common/CoreList.tsx";
import Confirmation from "./common/Confirmation.tsx";
import useListSwitching from "./common/useListSwitching.mts";

export type Modes = "lists" | "items";
export type DagModes = "navigate" | "select";

interface NodeSelectionProps {
  onSelected: (nodeIds: string[]) => void;
  multiple?: boolean;
  initialSelection?: string[];
}

const NodeSelection: React.FC<NodeSelectionProps> = ({
  onSelected,
  multiple = false,
  initialSelection = [],
}) => {
  const [mode, setMode] = useState<Modes>("items");
  const [lists, setLists] = useState<Array<List>>([]);
  const [loading, setLoading] = useState(true);
  const [allNodes, setAllNodes] = useState<Node[]>([]);
  const [currentParentIds, setCurrentParentIds] = useState<string[]>([]);
  const [dagMode, setDagMode] = useState<DagModes>("select");
  const [childItems, setChildItems] = useState<ListItem[]>([]);
  const [currentFilter, setCurrentFilter] = useState<NodeTreeFilter>(NodeTreeFilter.MAIN);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(initialSelection);
  const [selectedNodeHierarchies, setSelectedNodeHierarchies] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigateUpRef = useRef<() => Promise<void>>();

  // Update hierarchy paths when selectedNodeIds changes
  useEffect(() => {
    const updateHierarchies = async () => {
      if (selectedNodeIds.length === 0) {
        setSelectedNodeHierarchies([]);
        return;
      }

      const hierarchies: string[] = [];
      for (const nodeId of selectedNodeIds) {
        const node = allNodes.find(n => n.nodeId === nodeId);
        if (node) {
          const nodeTreeItem = { ...node, selected: false };
          const hierarchy = await formatNodeWithHierarchy(nodeTreeItem, []);
          hierarchies.push(hierarchy);
        }
      }
      setSelectedNodeHierarchies(hierarchies);
    };

    updateHierarchies();
  }, [selectedNodeIds, allNodes]);

  // Debug logging for state changes
  useEffect(() => {
    logger.debug("NodeSelection state changed", {
      mode,
      dagMode,
      currentParentIds,
      childItemsCount: childItems.length,
      listsCount: lists.length,
    });
  }, [mode, dagMode, currentParentIds, childItems.length, lists.length]);

  const { currentListItems, currentListIndex, switchListByIndex, switchListById } =
    useListSwitching(lists, 1); // Default to second list (main)

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const allNodes = await filteredNodeTree(NodeTreeFilter.ALL);
      setAllNodes(allNodes);

      // Initialize with main filter
      const nodes = await getFilteredRootNodes(NodeTreeFilter.MAIN);
      setCurrentParentIds([]);
      setCurrentFilter(NodeTreeFilter.MAIN);

      setChildItems(
        nodes.map((node) => ({
          id: node.nodeId,
          display: node.name,
          data: node,
        })),
      );

      setLists([
        {
          id: "all",
          display: "All",
          items: [],
        },
        {
          id: "main",
          display: "Main",
          items: [],
        },
        {
          id: "projects",
          display: "Projects",
          items: [],
        },
        {
          id: "trails",
          display: "Trails",
          items: [],
        },
        {
          id: "topics",
          display: "Topics",
          items: [],
        },
        {
          id: "modes",
          display: "Modes",
          items: [],
        },
        {
          id: "tags",
          display: "Tags",
          items: [],
        },
      ]);
    } catch (error) {
      logger.error("Error fetching nodes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChildrenNodes = useCallback(async (parentIds: string[]) => {
    if (parentIds.length === 0) {
      // Return root nodes
      const rootNodes: Node[] = [];
      for (const node of allNodes) {
        const parents = await getParentNodes(node.nodeId);
        if (parents.length === 0) {
          rootNodes.push(node);
        }
      }
      return rootNodes;
    }
    
    // Get children from database for each parent
    const allChildren: Node[] = [];
    for (const parentId of parentIds) {
      const children = await getChildNodes(parentId);
      allChildren.push(...children);
    }
    
    return allChildren;
  }, [allNodes]);

  const navigateToChildren = useCallback(async (selectedParentIds: string[]) => {
    const children = await getChildrenNodes(selectedParentIds);
    setCurrentParentIds(selectedParentIds);
    
    setChildItems(children.map(node => ({
      id: node.nodeId,
      display: node.name,
      data: node,
    })));
  }, [getChildrenNodes]);

  const navigateUp = useCallback(async () => {
    if (currentParentIds.length === 0) return;
    
    // Find the parents of current parent nodes
    const grandParentIds: string[] = [];
    for (const parentId of currentParentIds) {
      const parents = await getParentNodes(parentId);
      grandParentIds.push(...parents.map(p => p.nodeId));
    }
    
    // Remove duplicates
    const uniqueGrandParentIds = [...new Set(grandParentIds)];
    
    if (uniqueGrandParentIds.length === 0) {
      // Go back to root nodes
      const rootNodes: Node[] = [];
      for (const node of allNodes) {
        const parents = await getParentNodes(node.nodeId);
        if (parents.length === 0) {
          rootNodes.push(node);
        }
      }
      
      setCurrentParentIds([]);
      
      setChildItems(rootNodes.map(node => ({
        id: node.nodeId,
        display: node.name,
        data: node,
      })));
    } else {
      await navigateToChildren(uniqueGrandParentIds);
    }
  }, [currentParentIds, allNodes, navigateToChildren]);

  // Update the ref whenever navigateUp changes
  useEffect(() => {
    navigateUpRef.current = navigateUp;
  }, [navigateUp]);

  useEffect(() => {
    fetchNodes();
  }, []);

  // keymapping
  const { keymap } = useContext(KeysContext);

  // shared keymap
  useEffect(() => {
    const keymapConfig: KeymapConfig = [
      {
        sequence: [key("`")],
        description: "Toggle List/Items",
        name: "toggle-list-or-items",
        handler: () => {
          setMode((prevMode) => (prevMode === "lists" ? "items" : "lists"));
        },
        hidden: true,
      },
      {
        sequence: [key("u")],
        description: "Navigate up",
        name: "navigate-up",
        handler: () => navigateUpRef.current?.(),
      },
      {
        sequence: [key("'")],
        description: "Toggle navigate/select mode",
        name: "toggle-dag-mode",
        handler: () => {
          setDagMode((prev) => (prev === "navigate" ? "select" : "navigate"));
        },
      },
      {
        sequence: [key("\r", "return")],
        description: "Confirm selection",
        name: "confirm-selection",
        handler: () => {
          if (selectedNodeIds.length > 0) {
            setShowConfirmation(true);
          }
        },
      },
    ];

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [keymap, setMode, setDagMode]);

  return (
    <Box borderStyle="single" borderColor="gray">
      {loading ? (
        <Text>Loading nodes...</Text>
      ) : showConfirmation ? (
        <Confirmation
          message={`Confirm selection of ${selectedNodeIds.length} node${selectedNodeIds.length !== 1 ? 's' : ''}:\n${selectedNodeIds.map(id => {
            const node = allNodes.find(n => n.nodeId === id);
            return `• ${node?.name || id}`;
          }).join('\n')}`}
          onConfirm={() => {
            onSelected(selectedNodeIds);
            setShowConfirmation(false);
          }}
          onCancel={() => {
            setShowConfirmation(false);
          }}
        />
      ) : mode === "items" ? (
        <>
          <CoreList
            key={`${currentParentIds.join('-')}-${currentFilter}`}
            items={childItems}
            multiple={dagMode === "select" ? multiple : false}
            initialMode="select"
            reservedKeys={[":"]}
            statusText={dagMode === "navigate" ? "navigate" : "select"}
            initialSelection={selectedNodeIds.filter(id => 
              childItems.some(item => (item.data as Node).nodeId === id)
            )}
            onSelectionChange={(selectedItems: ListItem[]) => {
              // Update our internal selection state on every selection change
              const currentViewNodeIds = selectedItems.map(
                (item) => (item.data as Node).nodeId,
              );
              
              // Get the IDs of nodes currently visible in this view
              const currentViewAllNodeIds = childItems.map(item => (item.data as Node).nodeId);
              
              // Preserve selections from nodes not in current view, update selections for current view
              setSelectedNodeIds(prevSelected => {
                const notInCurrentView = prevSelected.filter(id => !currentViewAllNodeIds.includes(id));
                return [...notInCurrentView, ...currentViewNodeIds];
              });
            }}
            onSelected={async (selectedItems: ListItem[]) => {
              if (dagMode === "select") {
                // In selection mode, show confirmation
                setShowConfirmation(true);
              } else {
                // In navigate mode, navigate to children if available
                const selectedNode = selectedItems[0]?.data as Node;
                if (selectedNode) {
                  const children = await getChildrenNodes([selectedNode.nodeId]);
                  if (children.length > 0) {
                    await navigateToChildren([selectedNode.nodeId]);
                  }
                }
              }
            }}
          />
          {selectedNodeIds.length > 0 && (
            <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor="blue">
              <Text color="blue" bold>Selected ({selectedNodeIds.length}):</Text>
              {selectedNodeHierarchies.map((hierarchy, index) => (
                <Text key={index} color="cyan">• {hierarchy}</Text>
              ))}
            </Box>
          )}
        </>
      ) : (
        <CoreList
          items={lists}
          onSelected={async (selectedLists: List[]) => {
            if (selectedLists.length > 0) {
              const selectedList = selectedLists[0];
              
              // Map list ID to NodeTreeFilter
              let filter: NodeTreeFilter;
              switch (selectedList.id) {
                case "main":
                  filter = NodeTreeFilter.MAIN;
                  break;
                case "projects":
                  filter = NodeTreeFilter.PROJECTS;
                  break;
                case "trails":
                  filter = NodeTreeFilter.TRAILS;
                  break;
                case "topics":
                  filter = NodeTreeFilter.TOPICS;
                  break;
                case "modes":
                  filter = NodeTreeFilter.MODES;
                  break;
                case "tags":
                  filter = NodeTreeFilter.TAGS;
                  break;
                case "all":
                default:
                  filter = NodeTreeFilter.ALL;
                  break;
              }
              
              // Fetch filtered nodes and update childItems
              try {
                const filteredNodes = await getFilteredRootNodes(filter);
                setCurrentFilter(filter);
                setCurrentParentIds([]);
                
                setChildItems(
                  filteredNodes.map((node) => ({
                    id: node.nodeId,
                    display: node.name,
                    data: node,
                  })),
                );
                
                
                switchListById(selectedList.id);
                setMode("items");
              } catch (error) {
                logger.error("Error fetching filtered nodes:", error);
              }
            }
          }}
          multiple={false}
          initialMode="select"
          confirm={true}
        />
      )}
    </Box>
  );
};

export default NodeSelection;
