import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckRow } from './CheckRow';

const meta = {
  component: CheckRow,
  tags: ['ai-generated'],
} satisfies Meta<typeof CheckRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: { label: 'Include warm-up', checked: false, onChange: () => {} },
};

export const Checked: Story = {
  args: { label: 'Enable notifications', checked: true, onChange: () => {} },
};

export const WithTrailing: Story = {
  args: { label: 'Auto-rest timer', checked: true, onChange: () => {}, trailing: <span style={{ fontSize: 12, opacity: 0.6 }}>90s</span> },
};
