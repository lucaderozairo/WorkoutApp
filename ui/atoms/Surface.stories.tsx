import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Surface } from './Surface';

const meta = {
  component: Surface,
  tags: ['ai-generated'],
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Default surface card' },
  play: async ({ canvas }) => {
    const el = canvas.getByText('Default surface card');
    await expect(el).toBeVisible();
    await expect(getComputedStyle(el).borderRadius).toBe('14px');
  },
};

export const Plain: Story = {
  args: { variant: 'plain', children: 'Plain surface' },
};

export const Flat: Story = {
  args: { variant: 'flat', children: 'Flat surface' },
};

export const Accent: Story = {
  args: { variant: 'accent', children: 'Accent surface' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost surface' },
};

export const Inset: Story = {
  args: { variant: 'inset', children: 'Inset (dashed) surface' },
};

export const Interactive: Story = {
  args: { interactive: true, children: 'Click me' },
};

export const Selected: Story = {
  args: { selected: true, children: 'Selected surface' },
};

export const SmallPad: Story = {
  args: { pad: 'sm', children: 'Small padding' },
};

export const NoPad: Story = {
  args: { pad: 'none', children: 'No padding' },
};
