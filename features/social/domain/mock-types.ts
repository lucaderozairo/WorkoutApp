import type { Post } from './types';

export type PostWithMeta = Post & {
  sport?: string;
  group?: string;
  sessionName?: string;
};

export interface MockSuggestedGroup {
  id: string;
  initials: string;
  sport: 'lift' | 'run' | 'cycle' | 'swim';
  name: string;
  members: number;
  activity: string;
}

export interface MockSocialEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  time: string;
  sport: 'lift' | 'run' | 'cycle' | 'swim' | 'row';
}
