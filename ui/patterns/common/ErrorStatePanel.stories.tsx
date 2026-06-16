import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ui/molecules/Button';
import { ErrorStatePanel } from './ErrorStatePanel';

const meta = {
  component: ErrorStatePanel,
  tags: ['ai-generated'],
} satisfies Meta<typeof ErrorStatePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Recoverable: Story = {
  args: {
    title: 'Import failed',
    message: 'The file could not be parsed. Check the export format and try again.',
    action: <Button variant="secondary">Choose another file</Button>,
  },
};
