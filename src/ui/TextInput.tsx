import React, { useState } from "react";
import { useInput, Box, Newline, Text } from "ink";

type TextInputProps = {
  callback: (text: string) => void;
};

const TextInput: React.FC<TextInputProps> = ({ callback }) => {
  const [updatedText, setUpdatedText] = useState<string>("");

  useInput((input: any, key: any) => {
    if (key.return) {
      callback && callback(updatedText);
    } else if (input != "") {
      setUpdatedText(updatedText + input);
    }
  });

  return (
    <Box flexDirection="column">
      <Text>{updatedText}</Text>
      <Newline />
    </Box>
  );
};

export default TextInput;
