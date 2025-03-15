import React, { useState } from "react";
import { useInput, Box, Newline, Text } from "ink";
import Confirmation from "./common/Confirmation.tsx";

type VimMode = "normal" | "insert" | "append";

// Helper functions for word motion
const isWordChar = (char: string) => /[\w]/.test(char);

const findNextWordStart = (text: string, fromPos: number): number => {
  let pos = fromPos;
  // Move to the next non-word character
  while (pos < text.length && isWordChar(text[pos])) pos++;
  // Move to the next word character
  while (pos < text.length && !isWordChar(text[pos])) pos++;
  return pos;
};

const findPrevWordStart = (text: string, fromPos: number): number => {
  let pos = fromPos - 1;
  // Move back to the previous non-word character
  while (pos > 0 && !isWordChar(text[pos])) pos--;
  // Move back to the start of the word
  while (pos > 0 && isWordChar(text[pos - 1])) pos--;
  return pos;
};


type TextInputProps = {
  callback: (text: string) => void;
  confirm?: boolean;
  confirmMessage?: string;
};

const TextInput: React.FC<TextInputProps> = ({
  callback,
  confirm = false,
  confirmMessage = "Are you sure you want to proceed?",
}) => {
  const [updatedText, setUpdatedText] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [vimMode, setVimMode] = useState<VimMode>("normal");
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  useInput((input: any, key: any) => {
    if (key.return) {
      if (confirm) {
        setShowConfirmation(true);
      } else {
        callback && callback(updatedText);
      }
      return;
    }

    if (key.escape) {
      setVimMode("normal");
      return;
    }

    if (vimMode === "normal") {
      switch (input) {
        case "i":
          setVimMode("insert");
          return;
        case "a":
          setVimMode("append");
          setCursorPosition(Math.min(cursorPosition + 1, updatedText.length));
          return;
        case "h":
          setCursorPosition(Math.max(0, cursorPosition - 1));
          return;
        case "l":
          setCursorPosition(Math.min(updatedText.length, cursorPosition + 1));
          return;
        case "w":
          setCursorPosition(findNextWordStart(updatedText, cursorPosition));
          return;
        case "b":
          setCursorPosition(findPrevWordStart(updatedText, cursorPosition));
          return;
        case "0":
          setCursorPosition(0);
          return;
        case "$":
          setCursorPosition(updatedText.length);
          return;
      }
      return;
    }

    // Insert or Append mode
    if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        setUpdatedText(
          updatedText.slice(0, cursorPosition - 1) +
            updatedText.slice(cursorPosition),
        );
        setCursorPosition(cursorPosition - 1);
      }
    } else if (input !== "") {
      setUpdatedText(
        updatedText.slice(0, cursorPosition) +
          input +
          updatedText.slice(cursorPosition),
      );
      setCursorPosition(cursorPosition + 1);
    }
  });

  const handleConfirm = () => {
    callback && callback(updatedText);
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  return (
    <Box flexDirection="column">
      {showConfirmation ? (
        <Confirmation
          message={confirmMessage}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      ) : (
        <Box flexDirection="column">
          <Box>
            <Text>
              {updatedText.slice(0, cursorPosition)}
              <Text inverse>{updatedText[cursorPosition] || " "}</Text>
              {updatedText.slice(cursorPosition + 1)}
            </Text>
          </Box>
          <Text>Mode: {vimMode}</Text>
          <Newline />
        </Box>
      )}
    </Box>
  );
};

export default TextInput;
