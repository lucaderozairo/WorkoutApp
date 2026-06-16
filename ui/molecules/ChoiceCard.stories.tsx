import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChoiceCard } from './ChoiceCard';
import { Icon } from '../atoms/Icon';

const meta = {
  component: ChoiceCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof ChoiceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { title: 'Push Day', description: 'Chest, shoulders, triceps', onSelect: () => {} },
};

export const Selected: Story = {
  args: { title: 'Pull Day', description: 'Back, biceps', selected: true, onSelect: () => {} },
};

export const WithMetadata: Story = {
  args: { title: 'Leg Day', description: 'Quads, hamstrings, glutes', metadata: '~60 min', onSelect: () => {} },
};

export const WithLeadingIcon: Story = {
  args: { title: 'Full Body', description: 'All major muscle groups', leading: <Icon name="zap" />, onSelect: () => {} },
};

export const WithTrailing: Story = {
  args: { title: 'Cardio', description: 'Running, cycling', trailing: <Icon name="activity" />, onSelect: () => {} },
};

export const Disabled: Story = {
  args: { title: 'Rest Day', description: 'Not available today', disabled: true, onSelect: () => {} },
};
