import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from '@ui/atoms';
import { Button, SearchInput, Select } from '@ui/molecules';
import { FilterBar } from './FilterBar';

const meta = {
  component: FilterBar,
  tags: ['ai-generated'],
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WorkoutFilters: Story = {
  args: {
    search: <SearchInput value="" onChange={() => {}} placeholder="Search sessions" />,
    filters: (
      <>
        <Chip active>Runs</Chip>
        <Chip>Strength</Chip>
        <Select
          aria-label="Sort sessions"
          value="recent"
          onChange={() => {}}
          options={[
            { value: 'recent', label: 'Recent' },
            { value: 'load', label: 'Load' },
          ]}
        />
      </>
    ),
    actions: <Button variant="primary" size="sm">New session</Button>,
  },
};
