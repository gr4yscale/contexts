import React, { useState, useEffect, useContext } from "react";
import { Box, Text } from "ink";
import * as logger from "../logger.mts";
import { KeymapConfig, key } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";
import { getActiveTabDetails, ActiveTabDetails } from "../browser.mts";
import {
  createResource,
  ResourceType,
  addResourceNode,
} from "../models/resource.mts";
import { getCurrentNode } from "../models/node.mts";
import NodeSelection from "./NodeSelection.tsx";

interface ResourceCreateLinkProps {}

const ResourceCreateLink: React.FC<ResourceCreateLinkProps> = ({}) => {
  const [tabDetails, setTabDetails] = useState<ActiveTabDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [showNodeSelection, setShowNodeSelection] = useState(false);
  const [relatedNodeIds, setRelatedNodeIds] = useState<string[]>([]);

  const { keymap } = useContext(KeysContext);

  useEffect(() => {
    const fetchTabDetails = async () => {
      try {
        const details = await getActiveTabDetails();
        setTabDetails(details);
        const currentNode = await getCurrentNode();
        if (currentNode) {
          setRelatedNodeIds([currentNode.nodeId]);
        }
      } catch (error) {
        logger.error("Error fetching tab details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTabDetails();
  }, []);

  const handleCreateResource = async () => {
    if (!tabDetails || creating) {
      return;
    }

    setCreating(true);
    try {
      const resourceId = await createResource({
        name: tabDetails.title,
        data: { url: tabDetails.url },
        type: ResourceType.LINK,
      });

      const currentNode = await getCurrentNode();
      if (currentNode) {
        await addResourceNode(resourceId, currentNode.nodeId);
      }

      for (const nodeId of relatedNodeIds) {
        await addResourceNode(resourceId, nodeId);
      }

      setCreated(true);
    } catch (error) {
      logger.error("Error creating resource:", error);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!showNodeSelection) {
      const keymapConfig: KeymapConfig = [
        {
          sequence: [key("\r", "return")],
          name: "createResource",
          handler: async () => {
            await handleCreateResource();
          },
          description: "Create resource from current tab",
        },
        {
          sequence: [key("+")],
          name: "selectRelatedNodes",
          handler: () => {
            setShowNodeSelection(true);
          },
          description: "Select related nodes",
        },
      ];

      keymap.pushKeymap(keymapConfig);

      return () => {
        keymap.popKeymap();
      };
    }
  }, [keymap, handleCreateResource, showNodeSelection]);

  if (loading) {
    return (
      <Box flexDirection="column">
        <Text>Loading tab details...</Text>
      </Box>
    );
  }

  if (!tabDetails) {
    return (
      <Box flexDirection="column">
        <Text color="red">No active tab found</Text>
      </Box>
    );
  }

  if (showNodeSelection) {
    return (
      <NodeSelection
        onSelected={(nodeIds: string[]) => {
          logger.debug("ResourceCreateLink received selected nodeIds", {
            nodeIds,
          });
          setRelatedNodeIds(nodeIds);
          setShowNodeSelection(false);
        }}
        multiple={true}
        initialSelection={relatedNodeIds}
      />
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="blue">Create Link Resource</Text>
      <Text></Text>
      <Text>Title: {tabDetails.title}</Text>
      <Text>URL: {tabDetails.url}</Text>
      <Text></Text>
      {created ? (
        <Text color="green">✓ Resource created successfully!</Text>
      ) : creating ? (
        <Text color="yellow">Creating resource...</Text>
      ) : (
        <Text>Press return to create resource</Text>
      )}
    </Box>
  );
};

export default ResourceCreateLink;
