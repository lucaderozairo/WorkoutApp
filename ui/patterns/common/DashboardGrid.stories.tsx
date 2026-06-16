import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface, Text } from '@ui/atoms';
import { DashboardGrid } from './DashboardGrid';

const meta = {
  title: 'Patterns/DashboardGrid',
  component: DashboardGrid,
} satisfies Meta<typeof DashboardGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
      {['Readiness', 'Sleep', 'Load', 'Volume', 'Routes', 'Nutrition'].map((label) => (
        <Surface key={label} pad="sm">
          <Text as="h3">{label}</Text>
        </Surface>
      ))}
      </>
    ),
  },
};
