import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, hueFromName } from './Avatar';

describe('hueFromName', () => {
  it('is deterministic for the same name', () => {
    expect(hueFromName('Marcus T.')).toBe(hueFromName('Marcus T.'));
  });

  it('returns a value in [0, 359]', () => {
    const hue = hueFromName('Emma W.');
    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
  });

  it('differs between distinct names', () => {
    expect(hueFromName('Marcus T.')).not.toBe(hueFromName('Emma W.'));
  });
});

describe('Avatar', () => {
  it('sets a --avatar-hue custom property derived from the name', () => {
    render(<Avatar name="Jack P" />);
    const el = screen.getByLabelText('Jack P');
    expect(el.style.getPropertyValue('--avatar-hue')).toBe(`${hueFromName('Jack P')}deg`);
  });

  it('falls back to "?" with no hue variable when name is omitted', () => {
    render(<Avatar />);
    const el = screen.getByText('?');
    expect(el.style.getPropertyValue('--avatar-hue')).toBe('');
  });
});
