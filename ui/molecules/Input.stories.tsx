import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';
import { Icon } from '../atoms/Icon';

const meta = {
  component: Input,
  tags: ['ai-generated'],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: 'Enter value...' },
};

export const WithLabel: Story = {
  args: { label: 'Email', placeholder: 'you@example.com' },
};

export const WithHint: Story = {
  args: { label: 'Password', hint: 'Min 8 characters', placeholder: '********' },
};

export const WithError: Story = {
  args: { label: 'Email', error: 'Invalid email address', placeholder: 'you@example.com' },
};

export const WithLeadingIcon: Story = {
  args: {
    label: 'Search',
    placeholder: 'Search workouts...',
    leading: <Icon name="search" size="sm" />,
  },
};

export const Ghost: Story = {
  args: { variant: 'ghost', placeholder: 'Ghost input' },
};

export const Loading: Story = {
  args: { loading: true, placeholder: 'Loading...' },
};
