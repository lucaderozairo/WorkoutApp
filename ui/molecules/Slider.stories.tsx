import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Slider } from './Slider';

const meta = {
  component: Slider,
  tags: ['ai-generated'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 50, onChange: () => {} },
};

export const WithLabel: Story = {
  args: { value: 75, onChange: () => {}, label: 'Intensity', showValue: true },
};

export const CustomRange: Story = {
  args: { value: 30, min: 0, max: 100, step: 10, onChange: () => {}, label: 'Rest timer (s)', showValue: true },
};

export const Disabled: Story = {
  args: { value: 50, disabled: true, onChange: () => {}, label: 'Locked' },
};

export const Interactive: Story = {
  args: { value: 50, onChange: () => {} },
  render: function Render() {
    const [val, setVal] = useState(50);
    return <Slider value={val} onChange={setVal} label="Interactive" showValue />;
  },
};
