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

export const MOCK_UPCOMING_CALLS: MockUpcomingCall[] = [
  { id: 'call-1', initials: 'JS', name: 'Jane S', date: 'Sat 9 May', time: '10:00am', durationMin: 30, type: 'video' },
];

export const MOCK_RECENT_MESSAGES: MockRecentMessage[] = [
  { id: 'msg-1', initials: 'MT', name: 'Marcus T', preview: 'Running late for our session!', timeAgo: '4m ago', unread: true },
  { id: 'msg-2', initials: 'JP', name: 'Jack P', preview: "Hey, are we still on for tomorrow's run?...", timeAgo: '12h ago', unread: false },
];
