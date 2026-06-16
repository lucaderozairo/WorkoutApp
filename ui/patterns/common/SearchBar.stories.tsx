import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchBar } from './SearchBar';
import { noop, StoryPanel } from '../../storybook/storyData';

const meta = {
  component: SearchBar,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel><Story /></StoryPanel>],
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { value: '', onChange: noop, placeholder: 'Search workouts' },
};

export const WithValue: Story = {
  args: { value: 'threshold', onChange: noop, onClear: noop, onSubmit: noop },
};

export const Loading: Story = {
  args: { value: 'garmin', onChange: noop, loading: true },
};
