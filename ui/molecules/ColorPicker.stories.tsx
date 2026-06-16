import type { Meta, StoryObj } from '@storybook/react-vite';
import { ColorPicker } from './ColorPicker';
import { noop, StoryPanel } from '../storybook/storyData';

const meta = {
  component: ColorPicker,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel><Story /></StoryPanel>],
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSwatches: Story = {
  args: {
    label: 'Route color',
    hint: 'Used only for map overlays and chart traces.',
    value: '#4f8ef7',
    swatches: ['#4f8ef7', '#e8785a', '#6fbf73', '#b57bdc'],
    onValueChange: noop,
  },
};

export const Error: Story = {
  args: {
    label: 'Route color',
    value: '#ffffff',
    error: 'Choose a visible color.',
    swatches: ['#4f8ef7', '#e8785a', '#6fbf73'],
  },
};
