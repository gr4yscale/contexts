import React, { useEffect, useContext } from "react";
import { Box, Text } from "ink";
import { KeysContext } from "./Context.mts";
import { key, KeymapConfig } from "./Keymapping.mts";

interface ConfirmationProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmKey?: string;
  cancelKey?: string;
}

const Confirmation: React.FC<ConfirmationProps> = ({
  message,
  onConfirm,
  onCancel,
  confirmKey = "y",
  cancelKey = "n",
}) => {
  const { keymap } = useContext(KeysContext);

  useEffect(() => {
    const keymapConfig: KeymapConfig = [
      {
        sequence: [key(confirmKey)],
        description: "Confirm",
        name: "confirm-action",
        handler: onConfirm,
      },
      {
        sequence: [key(cancelKey)],
        description: "Cancel",
        name: "cancel-action",
        handler: onCancel,
      },
    ];

    keymap.pushKeymap(keymapConfig);

    return () => {
      keymap.popKeymap();
    };
  }, [onConfirm, onCancel, confirmKey, cancelKey]);

  return (
    <Box flexDirection="column">
      <Text>{message}</Text>
      <Text>
        Press ({confirmKey}) to confirm or ({cancelKey}) to cancel
      </Text>
    </Box>
  );
};

export default Confirmation;
