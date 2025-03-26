import React from "react";
import { Box } from "ink";
import CoreList from "./common/CoreList.tsx";

const Testbed: React.FC = () => {
  // Generate 100 test items
  const testItems = Array.from({ length: 100 }, (_, i) => ({
    id: `item-${i}`,
    display: `Test Item ${i}`,
    data: { id: `item-${i}`, name: `Test Item ${i}` },
  }));

  return (
    <Box flexDirection="column" width="100%">
      <CoreList />
    </Box>
  );
};

export default Testbed;
