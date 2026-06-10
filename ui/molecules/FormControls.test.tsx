import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { ChoiceCard } from './ChoiceCard';
import { Field, FormActions } from './Field';
import { RadioGroup } from './RadioGroup';
import { Select } from './Select';

describe('Field', () => {
  it('wires label, hint, and control description', () => {
    render(
      <Field id="effort" label="Effort" hint="Use session RPE.">
        {({ id, describedBy }) => (
          <input id={id} aria-describedby={describedBy} />
        )}
      </Field>,
    );

    const input = screen.getByLabelText('Effort');
    expect(input).toHaveAccessibleDescription('Use session RPE.');
  });

  it('prefers error text over hint text for description', () => {
    render(
      <Field id="name" label="Name" hint="Shown in profile." error="Name is required.">
        {({ id, describedBy, invalid }) => (
          <input id={id} aria-describedby={describedBy} aria-invalid={invalid} />
        )}
      </Field>,
    );

    const input = screen.getByLabelText('Name');
    expect(input).toHaveAccessibleDescription('Name is required.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('RadioGroup', () => {
  it('selects an option and respects disabled options', () => {
    const onChange = vi.fn();

    render(
      <RadioGroup
        name="mode"
        legend="Training mode"
        value="base"
        onChange={onChange}
        options={[
          { value: 'base', label: 'Base' },
          { value: 'build', label: 'Build' },
          { value: 'race', label: 'Race', disabled: true },
        ]}
      />,
    );

    expect(screen.getByRole('radio', { name: 'Base' })).toBeChecked();
    fireEvent.click(screen.getByRole('radio', { name: 'Build' }));

    expect(screen.getByRole('radio', { name: 'Race' })).toBeDisabled();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('build');
  });
});

describe('Select', () => {
  it('renders native options with label and error wiring', () => {
    render(
      <Select
        id="unit"
        label="Units"
        error="Choose a unit system."
        value=""
        onChange={() => {}}
        options={[
          { value: 'metric', label: 'Metric' },
          { value: 'imperial', label: 'Imperial' },
        ]}
      />,
    );

    const select = screen.getByLabelText('Units');
    expect(select).toHaveAccessibleDescription('Choose a unit system.');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('option', { name: 'Metric' })).toBeInTheDocument();
  });
});

describe('ChoiceCard', () => {
  it('acts as a selectable button', () => {
    const onSelect = vi.fn();

    render(
      <ChoiceCard
        title="Threshold run"
        description="Tempo effort"
        selected
        onSelect={onSelect}
      />,
    );

    const button = screen.getByRole('button', { name: /threshold run/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('FormActions', () => {
  it('uses the shared action row', () => {
    render(
      <FormActions>
        <Button>Cancel</Button>
        <Button variant="primary">Save</Button>
      </FormActions>,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
