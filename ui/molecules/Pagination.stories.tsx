import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from './Pagination';
import { noop, StoryPanel } from '../storybook/storyData';

const meta = {
  component: Pagination,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel><Story /></StoryPanel>],
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MiddlePage: Story = {
  args: { page: 3, pageCount: 8, onPageChange: noop },
};

export const FirstPage: Story = {
  args: { page: 1, pageCount: 8, onPageChange: noop },
};

export const LastPage: Story = {
  args: { page: 8, pageCount: 8, onPageChange: noop },
};
