import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle } from './Toggle';
import { Row } from '@ui/layout/Row';
import { Icon } from '../atoms/Icon';

const meta = {
  component: Toggle,
  tags: ['ai-generated'],
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unpressed: Story = {
  args: { pressed: false, children: 'Mute' },
};

export const Pressed: Story = {
  args: { pressed: true, children: 'Mute' },
};

export const WithIcon: Story = {
  args: { pressed: true, children: <Icon name="heart" /> },
};

export const Disabled: Story = {
  args: { pressed: false, disabled: true, children: 'Locked' },
};
