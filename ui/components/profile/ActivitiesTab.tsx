// ui/components/profile/ActivitiesTab.tsx
import { useQuery } from '@ui/bindings';
import { useNavigate } from 'react-router-dom';
import type { Post } from '@features/social';
import type { Id } from '@shared/types';
import { timeAgo } from '@shared/utils/timeAgo';

type SharedPost = Post & {
  sessionId?: Id<'Session'>;
  sport?: string;
  sessionName?: string;
};

const USER_ID = 'user-001' as Id<'User'>;

const SPORT_LABELS: Record<string, string> = {
  lift:  '🏋️ Gym',
  run:   '🏃 Run',
  cycle: '🚴 Cycle',
  swim:  '🏊 Swim',
  row:   '🚣 Row',
};

export function ActivitiesTab() {
  const navigate = useNavigate();
  const allPosts = (useQuery<SharedPost[]>('social_feed') ?? []) as SharedPost[];
  const myPosts  = allPosts.filter(p => p.authorId === USER_ID);

  if (myPosts.length === 0) {
    return (
      <div className="surface">
        <p className="muted">No shared sessions yet. Share a workout from your session history.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      {myPosts.map(post => (
        <div
          key={post.id}
          className="surface"
          onClick={() => post.sessionId && navigate(`/sessions/${post.sessionId}`)}
        >
          <div className="row space-between align-center">
            <div className="stack">
              <span>{post.sessionName ?? 'Workout'}</span>
              {post.sport && <span className="muted">{SPORT_LABELS[post.sport] ?? post.sport}</span>}
            </div>
            <time className="mono muted">{timeAgo(post.createdAt)}</time>
          </div>
          <p className="muted">{post.body}</p>
          <div className="row">
            <span className="caption">❤️ {post.likeCount} likes</span>
            <span className="caption">💬 {post.comments.length}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
