import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox';

const meta = {
  component: Checkbox,
  tags: ['ai-generated'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: { checked: false, onChange: () => {}, label: 'Accept terms' },
};

export const Checked: Story = {
  args: { checked: true, onChange: () => {}, label: 'Remember me' },
};

export const Disabled: Story = {
  args: { checked: false, disabled: true, onChange: () => {}, label: 'Locked option' },
};

export const DisabledChecked: Story = {
  args: { checked: true, disabled: true, onChange: () => {}, label: 'Grandfathered' },
};

export const Indeterminate: Story = {
  args: { checked: false, indeterminate: true, onChange: () => {}, label: 'Mixed selection' },
};

export const NoLabel: Story = {
  args: { checked: true, onChange: () => {} },
};
