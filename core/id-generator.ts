import type { Id, IdGenerator } from '@shared/contracts';

export const cryptoIdGenerator: IdGenerator = {
  next<T = unknown>(): Id<T> {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('') as Id<T>;
  },
};
