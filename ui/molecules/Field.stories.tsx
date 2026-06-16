import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { Field, Fieldset, FormActions } from './Field';
import { StoryPanel } from '../storybook/storyData';

const meta = {
  title: 'Molecules/Field',
  component: Field,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel maxWidth={420}><Story /></StoryPanel>],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextControl: Story = {
  args: { children: null },
  render: () => (
    <Field label="Target pace" hint="Use min/km format." required>
      {({ id, describedBy }) => (
        <input id={id} aria-describedby={describedBy} className="input" defaultValue="4:18" />
      )}
    </Field>
  ),
};

export const WithError: Story = {
  args: { children: null },
  render: () => (
    <Field label="HRV baseline" error="Enter a value between 20 and 160 ms.">
      {({ id, describedBy, invalid }) => (
        <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className="input error" defaultValue="8" />
      )}
    </Field>
  ),
};

export const FieldsetWithActions: Story = {
  args: { children: null },
  render: () => (
    <Fieldset legend="Weekly focus" hint="Select one or more tags." optional>
      <label><input type="checkbox" defaultChecked /> Threshold</label>
      <label><input type="checkbox" /> Strength</label>
      <FormActions>
        <Button variant="secondary" size="sm">Cancel</Button>
        <Button variant="primary" size="sm">Save focus</Button>
      </FormActions>
    </Fieldset>
  ),
};
