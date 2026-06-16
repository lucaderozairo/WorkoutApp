import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Input } from '@ui/molecules';
import { Text } from '@ui/atoms';
import { FormLayout } from './FormLayout';

const meta = {
  title: 'Patterns/FormLayout',
  component: FormLayout,
} satisfies Meta<typeof FormLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    header: <Text as="h2">Edit profile</Text>,
    children: <Input label="Display name" defaultValue="Alex Runner" />,
    actions: <Button>Save changes</Button>,
  },
};
