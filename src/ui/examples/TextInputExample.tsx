import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from '../TextInput';

interface TextInputExampleProps {
  onSubmit?: (value: string) => void;
  initialValue?: string;
  placeholder?: string;
}

const TextInputExample: React.FC<TextInputExampleProps> = ({
  onSubmit,
  initialValue = '',
  placeholder = 'Type something...'
}) => {
  const [value, setValue] = useState(initialValue);
  
  const handleSubmit = (text: string) => {
    setValue(text);
    if (onSubmit) {
      onSubmit(text);
    }
  };
  
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text>Enter text below:</Text>
      </Box>
      <TextInput 
        callback={handleSubmit}
        placeholder={placeholder}
      />
      {value && (
        <Box marginTop={1}>
          <Text>You typed: <Text color="green">{value}</Text></Text>
        </Box>
      )}
    </Box>
  );
};

export default TextInputExample;
