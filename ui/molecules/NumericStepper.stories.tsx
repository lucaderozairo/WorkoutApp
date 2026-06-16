import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { NumericStepper } from './NumericStepper';
import { Row } from '@ui/layout/Row';

const meta = {
  component: NumericStepper,
  tags: ['ai-generated'],
} satisfies Meta<typeof NumericStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 50, onChange: () => {}, label: 'Weight (kg)' },
};

export const Bounded: Story = {
  args: { value: 3, min: 1, max: 10, onChange: () => {}, label: 'Sets' },
};

export const Steps: Story = {
  args: { value: 2.5, min: 0, max: 10, step: 0.5, onChange: () => {}, label: 'Increment' },
};

export const NoLabel: Story = {
  args: { value: 100, onChange: () => {} },
};

export const Comparison: Story = {
  args: { value: 0, onChange: () => {} },
  render: function Render() {
    const [squat, setSquat] = useState(80);
    const [bench, setBench] = useState(60);
    const [deadlift, setDeadlift] = useState(100);
    return (
      <Row gap={3}>
        <NumericStepper value={squat} onChange={setSquat} label="Squat" min={0} max={300} />
        <NumericStepper value={bench} onChange={setBench} label="Bench" min={0} max={200} />
        <NumericStepper value={deadlift} onChange={setDeadlift} label="Deadlift" min={0} max={400} />
      </Row>
    );
  },
};
