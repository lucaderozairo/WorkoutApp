import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';

const meta = {
  component: Textarea,
  tags: ['ai-generated'],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: 'Write your notes here...' },
};

export const WithLabel: Story = {
  args: { label: 'Workout Notes', placeholder: 'How did it feel?', rows: 4 },
};

export const WithHint: Story = {
  args: { label: 'Description', hint: 'Brief description of the exercise', rows: 3 },
};

export const WithError: Story = {
  args: { label: 'Comment', error: 'Comment is required', rows: 3 },
};

export const AutoGrow: Story = {
  args: { label: 'Journal', autoGrow: true, placeholder: 'Start typing and it grows...', rows: 2 },
};
