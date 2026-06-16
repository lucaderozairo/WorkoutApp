import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ui/molecules/Button';
import { SettingsSection } from './SettingsSection';
import { settingsRows } from '../../storybook/storyData';

const meta = {
  component: SettingsSection,
  tags: ['ai-generated'],
} satisfies Meta<typeof SettingsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Training data',
    description: 'Controls how imported sessions and device values are normalised.',
    action: <Button variant="secondary" size="sm">Edit</Button>,
    children: settingsRows,
  },
};
