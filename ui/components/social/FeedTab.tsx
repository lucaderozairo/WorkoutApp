import { useState } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import { handleCreatePost } from '@features/social';
import type { Post } from '@features/social/contract';
import type { PostWithMeta } from '@features/social/contract';
import type { ActivityHistoryItem, ActivitiesState } from '@features/training_log/contract';
import type { CardioSession } from '@features/cardio/contract';
import { PostCard } from './PostCard';
import { StrengthActivityCard, CardioActivityCard } from './ActivityPostCard';
import { USER_ID, USER_NAME, USER_INITIALS } from '@features/social/domain/constants';
import { Row } from '@ui/layout';
import { Surface, Avatar, Text } from '@ui/atoms';
import { Button } from '@ui/molecules';

type FeedItem =
  | { kind: 'post';     ts: number; data: PostWithMeta }
  | { kind: 'strength'; ts: number; data: ActivityHistoryItem }
  | { kind: 'cardio';   ts: number; data: CardioSession };

function deriveHistory(state: ActivitiesState | null): ActivityHistoryItem[] {
  if (!state) return [];
  return Object.values(state.byId)
    .filter(s => s.status === 'finished' && s.startedAt != null)
    .map(s => {
      const sets = s.segments.flatMap(b => b.sets);
      const working = sets.filter(set => !set.isWarmup && (set.weightKg !== undefined || set.reps !== undefined));
      return {
        id: s.id,
        name: s.name,
        primarySport: s.primarySport,
        startedAt: s.startedAt!,
        finishedAt: s.finishedAt ?? s.startedAt!,
        durationSeconds: s.finishedAt && s.startedAt
          ? Math.round((s.finishedAt - s.startedAt) / 1000) : 0,
        totalSets: working.length,
        exerciseCount: new Set(s.segments.map(b => b.exerciseName)).size,
        hasPR: sets.some(set => set.isPR),
        category: s.segments.some(b => b.exerciseCategory === 'cardio') ? 'cardio' as const : 'strength' as const,
        rpe: s.rpe,
        tags: s.tags,
        notes: s.notes || undefined,
        comments: s.comments,
        media: s.media,
      };
    });
}

export function FeedTab() {
  const [body, setBody] = useState('');
  const liveFeed    = (useQuery<Post[]>('social_feed') ?? []) as PostWithMeta[];
  const mockPosts   = (useQuery<PostWithMeta[]>('social_posts_mock') ?? []) as PostWithMeta[];
  const sessionsState = useQuery<ActivitiesState>('sessions');
  const cardioState   = useQuery<{ sessions: CardioSession[] }>('recent_cardio_sessions');
  const { dispatch: createPost } = useCommand(handleCreatePost);

  const strengthSessions = deriveHistory(sessionsState ?? null);
  const cardioSessions   = cardioState?.sessions ?? [];

  const feed: FeedItem[] = [
    ...liveFeed.map(p  => ({ kind: 'post'     as const, ts: p.createdAt,        data: p })),
    ...mockPosts.map(p => ({ kind: 'post'     as const, ts: p.createdAt,        data: p })),
    ...strengthSessions.map(s => ({ kind: 'strength' as const, ts: s.startedAt, data: s })),
    ...cardioSessions.map(s   => ({ kind: 'cardio'   as const, ts: s.startedAt, data: s })),
  ].sort((a, b) => b.ts - a.ts);

  const handlePost = async () => {
    if (!body.trim()) return;
    await createPost({ type: 'CreatePost', userId: USER_ID, authorName: USER_NAME, authorInitials: USER_INITIALS, body });
    setBody('');
  };

  return (
    <>
      <Surface>
        <Row justify="between">
          <Avatar name={USER_INITIALS} className="lift" />
          <input id="composer-input" placeholder="Share a workout or activity…"
            value={body} onChange={e => setBody(e.target.value)} />
        </Row>
        <Button variant="primary" size="sm" onClick={handlePost}>Post</Button>
      </Surface>
      <Text as="h3">Recent Activity</Text>
      {feed.length === 0 && <Text>No posts yet.</Text>}
      {feed.map(item => {
        if (item.kind === 'post')     return <PostCard key={item.data.id}     post={item.data} />;
        if (item.kind === 'strength') return <StrengthActivityCard key={item.data.id} session={item.data} />;
        return <CardioActivityCard key={item.data.id} session={item.data} />;
      })}
    </>
  );
}
