import React, { useState, useEffect, useContext } from "react";
import { Box, Text } from "ink";
import { KeymapConfig, key } from "./common/Keymapping.mts";
import { KeysContext } from "./common/Context.mts";
import { getActiveTabDetails, ActiveTabDetails } from "../browser.mts";
import { createResource, ResourceType } from "../models/resource.mts";

interface ResourceCreateLinkProps {
  onKeyPress?: (key: string) => void;
}

const ResourceCreateLink: React.FC<ResourceCreateLinkProps> = ({ onKeyPress }) => {
  const [tabDetails, setTabDetails] = useState<ActiveTabDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  
  const { keymap } = useContext(KeysContext);

  useEffect(() => {
    const fetchTabDetails = async () => {
      try {
        const details = await getActiveTabDetails();
        setTabDetails(details);
      } catch (error) {
        console.error("Error fetching tab details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTabDetails();
  }, []);

  const handleCreateResource = async () => {
    if (!tabDetails || creating) return;

    setCreating(true);
    try {
      const resourceId = await createResource({
        name: tabDetails.title,
        data: { url: tabDetails.url },
        type: ResourceType.LINK,
      });
      console.log(`Created resource with ID: ${resourceId}`);
      setCreated(true);
    } catch (error) {
      console.error("Error creating resource:", error);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const keymapConfig: KeymapConfig = [
      {
        sequence: [key("`")],
        name: "createResource",
        handler: () => {
          handleCreateResource();
          onKeyPress?.("`");
        },
        description: "Create resource from current tab"
      }
    ];

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [keymap, onKeyPress]);

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
        <Text>Press ` to create resource</Text>
      )}
    </Box>
  );
};

export default ResourceCreateLink;
