import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Button } from './Button';
import { Icon } from '../atoms/Icon';

const meta = {
  component: Button,
  tags: ['ai-generated'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary', children: 'Start Workout' },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: /start workout/i });
    await expect(btn).toBeVisible();
    await expect(getComputedStyle(btn).backgroundColor).toBe('rgb(79, 142, 247)');
  },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Cancel' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'More info' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete' },
};

export const Small: Story = {
  args: { size: 'sm', children: 'Confirm' },
};

export const Large: Story = {
  args: { size: 'lg', children: 'Submit' },
};

export const IconButton: Story = {
  args: {
    size: 'icon',
    variant: 'ghost',
    children: <Icon name="check" />,
    'aria-label': 'Confirm',
  },
};

export const Loading: Story = {
  args: { loading: true, children: 'Saving...' },
};

export const Block: Story = {
  args: { block: true, children: 'Full Width' },
};

export const Active: Story = {
  args: { active: true, children: 'Selected' },
};

export const CssCheck: Story = {
  args: { variant: 'primary', children: 'Submit' },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: /submit/i });
    await expect(getComputedStyle(btn).backgroundColor).toBe('rgb(79, 142, 247)');
    await expect(getComputedStyle(btn).fontWeight).toBe('600');
    await expect(getComputedStyle(btn).borderRadius).toBe('8px');
  },
};
