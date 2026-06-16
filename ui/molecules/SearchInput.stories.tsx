import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchInput } from './SearchInput';
import { useState } from 'react';

const meta = {
  component: SearchInput,
  tags: ['ai-generated'],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: function Render() {
    const [val, setVal] = useState('');
    return <SearchInput value={val} onChange={(e) => setVal(e.target.value)} onClear={() => setVal('')} placeholder="Search exercises..." />;
  },
};

export const WithValue: Story = {
  render: function Render() {
    const [val, setVal] = useState('bench press');
    return <SearchInput value={val} onChange={(e) => setVal(e.target.value)} onClear={() => setVal('')} />;
  },
};

export const Loading: Story = {
  args: { loading: true, placeholder: 'Searching...' },
};
