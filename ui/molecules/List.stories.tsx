import type { Meta, StoryObj } from '@storybook/react-vite';
import { List, ListItem } from './List';
import { Icon } from '../atoms/Icon';

const meta = {
  component: List,
  tags: ['ai-generated'],
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: { children: null },
  render: () => (
    <List>
      <ListItem label="Bench Press" sublabel="3 x 10 @ 80kg" />
      <ListItem label="Squat" sublabel="4 x 8 @ 100kg" />
      <ListItem label="Deadlift" sublabel="3 x 5 @ 120kg" />
    </List>
  ),
};

export const Divided: Story = {
  args: { children: null },
  render: () => (
    <List divided>
      <ListItem label="Push" sublabel="Chest, shoulders, triceps" />
      <ListItem label="Pull" sublabel="Back, biceps" />
      <ListItem label="Legs" sublabel="Quads, hamstrings, glutes" />
    </List>
  ),
};

export const WithLeading: Story = {
  args: { children: null },
  render: () => (
    <List divided>
      <ListItem label="Inbox" leading={<Icon name="bell" size="sm" />} trailing={<span style={{ fontSize: 12, fontWeight: 600 }}>3</span>} />
      <ListItem label="Archive" leading={<Icon name="clock" size="sm" />} />
      <ListItem label="Trash" leading={<Icon name="delete" size="sm" />} />
    </List>
  ),
};

export const Interactive: Story = {
  args: { children: null },
  render: () => (
    <List divided>
      <ListItem label="Edit Profile" interactive onClick={() => {}} leading={<Icon name="settings" size="sm" />} />
      <ListItem label="Notifications" interactive onClick={() => {}} leading={<Icon name="bell" size="sm" />} />
      <ListItem label="Privacy" interactive onClick={() => {}} leading={<Icon name="lock" size="sm" />} />
    </List>
  ),
};
