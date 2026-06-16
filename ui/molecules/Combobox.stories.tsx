import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { Combobox } from './Combobox';
import { StoryPanel } from '../storybook/storyData';

const options = [
  { value: 'bench', label: 'Bench press', searchText: 'bench chest press' },
  { value: 'squat', label: 'Back squat', searchText: 'squat legs strength' },
  { value: 'tempo', label: 'Tempo run', searchText: 'run threshold tempo' },
  { value: 'race', label: 'Race simulation', disabled: true },
];

const meta = {
  component: Combobox,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel><Story /></StoryPanel>],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 'bench', onChange: () => {}, options },
  render: function Render() {
    const [value, setValue] = useState('bench');
    return (
      <Combobox
        label="Session focus"
        hint="Search the training library."
        value={value}
        onChange={setValue}
        options={options}
        placeholder="Search sessions"
      />
    );
  },
};

export const Filtered: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('combobox');
    await userEvent.clear(input);
    await userEvent.type(input, 'run');
    await expect(canvas.getByRole('option', { name: /tempo run/i })).toBeVisible();
  },
};

export const Error: Story = {
  args: {
    label: 'Session focus',
    error: 'Choose a valid session.',
    value: '',
    onChange: () => {},
    options,
    placeholder: 'Search sessions',
  },
};
