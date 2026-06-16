import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RadioGroup } from './RadioGroup';
import type { RadioOption } from './RadioGroup';

const UNITS: RadioOption[] = [
  { value: 'metric', label: 'Metric', description: 'kg, km' },
  { value: 'imperial', label: 'Imperial', description: 'lbs, miles' },
];

const DIFFICULTY: RadioOption[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const meta = {
  component: RadioGroup,
  tags: ['ai-generated'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ColumnLayout: Story = {
  args: { name: 'units', value: 'metric', onChange: () => {}, options: UNITS, legend: 'Units' },
  render: function Render() {
    const [val, setVal] = useState('metric');
    return <RadioGroup name="units" value={val} onChange={setVal} options={UNITS} legend="Units" />;
  },
};

export const RowLayout: Story = {
  args: { name: 'difficulty', value: 'intermediate', onChange: () => {}, options: DIFFICULTY, legend: 'Experience' },
  render: function Render() {
    const [val, setVal] = useState('intermediate');
    return <RadioGroup name="difficulty" value={val} onChange={setVal} options={DIFFICULTY} legend="Experience" orientation="row" />;
  },
};

export const WithError: Story = {
  args: { name: 'pick', value: '', onChange: () => {}, options: UNITS, legend: 'Selection', error: 'Please choose an option' },
  render: function Render() {
    const [val, setVal] = useState('');
    return <RadioGroup name="pick" value={val} onChange={setVal} options={UNITS} legend="Selection" error="Please choose an option" />;
  },
};
