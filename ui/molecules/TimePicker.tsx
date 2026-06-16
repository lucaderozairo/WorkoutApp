import type { InputHTMLAttributes } from 'react';
import { Input } from './Input';

interface TimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  hint?: string;
  error?: string;
}

export function TimePicker(props: TimePickerProps) {
  return <Input {...props} type="time" />;
}
