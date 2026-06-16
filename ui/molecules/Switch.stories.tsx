import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { userEvent as userEventLib } from 'storybook/test';
import { useState } from 'react';
import { Switch } from './Switch';

const meta = {
  component: Switch,
  tags: ['ai-generated'],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: { checked: false, onChange: () => {}, label: 'Notifications' },
};

export const On: Story = {
  args: { checked: true, onChange: () => {}, label: 'Dark mode' },
};

export const Disabled: Story = {
  args: { checked: false, disabled: true, onChange: () => {}, label: 'Locked' },
};

export const Small: Story = {
  args: { checked: true, size: 'sm', onChange: () => {}, label: 'Compact' },
};

export const NoLabel: Story = {
  args: { checked: true, onChange: () => {} },
};

export const Toggle: Story = {
  args: { checked: false, onChange: () => {} },
  render: function Render() {
    const [checked, setChecked] = useState(false);
    return <Switch checked={checked} onChange={setChecked} label="Toggle me" />;
  },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('switch');
    await expect(btn.getAttribute('aria-checked')).toBe('false');
    await userEventLib.click(btn);
    await expect(btn.getAttribute('aria-checked')).toBe('true');
  },
};
