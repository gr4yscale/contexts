import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect, vi } from 'vitest';
import TextInputExample from './TextInputExample';

describe('TextInputExample', () => {
  it('renders with default placeholder', () => {
    const { lastFrame } = render(<TextInputExample />);
    expect(lastFrame()).toContain('Enter text below:');
    expect(lastFrame()).toContain('Type something...');
  });

  it('renders with custom placeholder', () => {
    const { lastFrame } = render(<TextInputExample placeholder="Custom placeholder" />);
    expect(lastFrame()).toContain('Custom placeholder');
  });

  it('shows typed text and calls onSubmit when Enter is pressed', () => {
    const onSubmit = vi.fn();
    const { stdin, lastFrame } = render(
      <TextInputExample onSubmit={onSubmit} />
    );

    // Type "Hello World"
    stdin.write('Hello World');
    expect(lastFrame()).toContain('Hello World');

    // Press Enter
    stdin.write('\r');
    
    // Check if onSubmit was called with the correct value
    expect(onSubmit).toHaveBeenCalledWith('Hello World');
    expect(lastFrame()).toContain('You typed: Hello World');
  });

  it('starts with initial value if provided', () => {
    const { lastFrame } = render(
      <TextInputExample initialValue="Initial text" />
    );
    
    expect(lastFrame()).toContain('Initial text');
  });
});
