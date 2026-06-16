import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { userEvent as userEventLib } from 'storybook/test';
import { useState } from 'react';
import { Tabs, TabsContent } from './Tabs';

const TABS = [
  { id: 'overview' as const, label: 'Overview' },
  { id: 'details' as const, label: 'Details' },
  { id: 'history' as const, label: 'History' },
];

const meta = {
  component: Tabs,
  tags: ['ai-generated'],
  render: () => {
    const [active, setActive] = useState('overview');
    return (
      <>
        <Tabs items={TABS} value={active} onChange={(id) => setActive(id)} />
        <TabsContent value="overview" activeValue={active}>Overview panel</TabsContent>
        <TabsContent value="details" activeValue={active}>Details panel</TabsContent>
        <TabsContent value="history" activeValue={active}>History panel</TabsContent>
      </>
    );
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeTabs: Story = {
  args: { items: TABS, value: 'overview', onChange: () => {} },
};

export const WithInteraction: Story = {
  args: { items: TABS, value: 'overview', onChange: () => {} },
  play: async ({ canvas }) => {
    const detailsTab = canvas.getByRole('tab', { name: /details/i });
    await userEventLib.click(detailsTab);
    await expect(detailsTab.getAttribute('aria-selected')).toBe('true');
  },
};
