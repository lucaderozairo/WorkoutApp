import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './Text';

const meta = {
  component: Text,
  tags: ['ai-generated'],
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Body: Story = {
  args: { children: 'Body text — the default size' },
};

export const Detail: Story = {
  args: { size: 'detail', children: 'Detail text — slightly smaller' },
};

export const Caption: Story = {
  args: { size: 'caption', children: 'Caption text — small print' },
};

export const Eyebrow: Story = {
  args: { size: 'eyebrow', children: 'EYEBROW TEXT' },
};

export const Muted: Story = {
  args: { color: 'muted', children: 'Muted text' },
};

export const Faint: Story = {
  args: { color: 'faint', children: 'Faint text' },
};

export const Positive: Story = {
  args: { color: 'positive', children: 'Positive text' },
};

export const Negative: Story = {
  args: { color: 'negative', children: 'Negative text' },
};

export const Mono: Story = {
  args: { mono: true, children: '1234 Mono text' },
};

export const Bold: Story = {
  args: { bold: true, children: 'Bold text' },
};

export const Truncate: Story = {
  args: { truncate: true, children: 'This is a very long text that should be truncated with an ellipsis when it reaches the container width' },
};

export const AsHeading: Story = {
  args: { as: 'h3', children: 'This renders as an h3' },
};
