import type { Meta, StoryObj } from '@storybook/react-vite';
import { PhotoGallery } from './PhotoGallery';
import { noop, StoryPanel } from '../storybook/storyData';

const photos = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="%23dde5f5"/><circle cx="80" cy="60" r="28" fill="%234f8ef7"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect width="160" height="120" fill="%23ebf0fa"/><path d="M20 90 L70 35 L120 90 Z" fill="%236fbf73"/></svg>',
];

const meta = {
  component: PhotoGallery,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel><Story /></StoryPanel>],
} satisfies Meta<typeof PhotoGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPhotos: Story = {
  args: { label: 'Route photos', photos, onAdd: noop, onRemove: noop },
};

export const Empty: Story = {
  args: { label: 'Route photos', photos: [], onAdd: noop, onRemove: noop },
};
