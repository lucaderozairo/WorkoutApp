// Messaging feature is currently view-only — no commands, events, or
// projections yet. Types describe the UI shapes seeded by /data/mock/messages.

export interface MockUpcomingCall {
  id: string;
  initials: string;
  name: string;
  date: string;
  time: string;
  durationMin: number;
  type: 'video' | 'audio';
}

export interface MockRecentMessage {
  id: string;
  initials: string;
  name: string;
  preview: string;
  timeAgo: string;
  unread: boolean;
}
