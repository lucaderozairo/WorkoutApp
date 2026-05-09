import type { Id } from '@shared/types';
import type { Post } from '@features/social';

export type PostWithMeta = Post & { sport?: string; group?: string; sessionName?: string };

export const MOCK_POSTS: PostWithMeta[] = [
  {
    id: 'seed-1' as Id<'Post'>,
    authorId: 'user-jd' as Id<'User'>,
    authorName: 'Marcus T.',
    authorInitials: 'MT',
    sport: 'lift',
    group: 'Kingston Barbell Club',
    sessionName: 'Push Day',
    body: 'Bench PR today — 150kg single 🔥',
    likeCount: 14,
    likedByMe: false,
    comments: [],
    createdAt: Date.now() - 3_600_000,
  },
  {
    id: 'seed-2' as Id<'Post'>,
    authorId: 'user-sr' as Id<'User'>,
    authorName: 'Emma W.',
    authorInitials: 'EW',
    sport: 'run',
    group: 'Thames Path Run Club',
    sessionName: 'Tempo Run',
    body: 'Tempo Tuesday — felt strong all the way through',
    likeCount: 9,
    likedByMe: true,
    comments: [],
    createdAt: Date.now() - 7_200_000,
  },
  {
    id: 'seed-3' as Id<'Post'>,
    authorId: 'user-dk' as Id<'User'>,
    authorName: 'Dan K.',
    authorInitials: 'DK',
    sport: 'row',
    group: 'Hyrox Richmond',
    sessionName: '2k Erg Test',
    body: 'New PB by 4 seconds 🚣',
    likeCount: 18,
    likedByMe: true,
    comments: [],
    createdAt: Date.now() - 14_400_000,
  },
];

export interface MockSuggestedGroup {
  id: string;
  initials: string;
  sport: 'lift' | 'run' | 'cycle' | 'swim';
  name: string;
  members: number;
  activity: string;
}

export const MOCK_SUGGESTED_GROUPS: MockSuggestedGroup[] = [
  { id: 'g1', initials: 'KB', sport: 'lift', name: 'Kingston Barbell Club', members: 142, activity: '12 posts/week' },
  { id: 'g2', initials: 'TP', sport: 'run', name: 'Thames Path Run Club', members: 89, activity: '8 posts/week' },
  { id: 'g3', initials: 'HR', sport: 'cycle', name: 'Hampton Road Cyclists', members: 67, activity: '5 posts/week' },
  { id: 'g4', initials: 'RW', sport: 'swim', name: 'River Swim Squad', members: 34, activity: '3 posts/week' },
];

export interface MockSocialEvent {
  id: string;
  sport: 'run' | 'lift' | 'cycle';
  name: string;
  date: string;
  location: string;
  time: string;
}

export const MOCK_UPCOMING_EVENTS: MockSocialEvent[] = [
  { id: 'e1', sport: 'run', name: 'Park Run 5K', date: '12 Apr', location: 'Victoria Park', time: '08:00' },
  { id: 'e2', sport: 'lift', name: 'Deadlift Challenge', date: '19 Apr', location: 'FitTrack Online', time: 'All day' },
  { id: 'e3', sport: 'cycle', name: 'Group Ride 40K', date: '26 Apr', location: 'Riverside Route', time: '09:30' },
];
