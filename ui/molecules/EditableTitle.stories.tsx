import type { Meta, StoryObj } from '@storybook/react-vite';
import { EditableTitle } from './EditableTitle';

const meta = {
  component: EditableTitle,
  tags: ['ai-generated'],
} satisfies Meta<typeof EditableTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const H2: Story = {
  args: { value: 'Morning Workout', placeholder: 'Session name', onSave: () => {} },
};

export const H1: Story = {
  args: { value: 'My Fitness Journey', placeholder: 'Title', level: 'h1', onSave: () => {} },
};

export const Empty: Story = {
  args: { value: '', placeholder: 'Click to name your session', onSave: () => {} },
};
