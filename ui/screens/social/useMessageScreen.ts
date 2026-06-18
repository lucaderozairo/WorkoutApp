import { useQuery } from '@ui/bindings';
import type { MockUpcomingCall, MockRecentMessage } from '@features/messaging';

export function useMessageScreen() {
  const calls = (useQuery('messages_calls') ?? []) as MockUpcomingCall[];
  const chats = (useQuery('messages_chats') ?? []) as MockRecentMessage[];
  return { calls, chats };
}
