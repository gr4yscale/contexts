import React from "react";
import { Box } from "ink";
import TextInput from "./TextInput.tsx";

import { createActivity } from "../models/activity.mts";

const ActivityCreate: React.FC = () => {
  return (
    <Box flexDirection="column">
      <TextInput
        callback={(name: string) => {
          if (name === "") return; // TODO validation
          createActivity({ name });
        }}
      />
    </Box>
  );
};

export default ActivityCreate;
