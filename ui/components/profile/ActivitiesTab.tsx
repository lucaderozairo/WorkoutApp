// ui/components/profile/ActivitiesTab.tsx
import { useQuery } from '@ui/bindings';
import { useNavigate } from 'react-router-dom';
import type { Post } from '@features/social';
import type { Id } from '@shared/types';
import { timeAgo } from '@shared/utils/timeAgo';
import { Row, Column } from '@ui/layout';
import { Surface } from '@ui/atoms';

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
      <Surface>
        <p className="muted">No shared sessions yet. Share a workout from your session history.</p>
      </Surface>
    );
  }

  return (
    <Column>
      {myPosts.map(post => (
        <Surface
          key={post.id}
          onClick={() => post.sessionId && navigate(`/sessions/${post.sessionId}`)}
        >
          <Row justify="between" align="center">
            <Column>
              <span>{post.sessionName ?? 'Workout'}</span>
              {post.sport && <span className="muted">{SPORT_LABELS[post.sport] ?? post.sport}</span>}
            </Column>
            <time className="mono muted">{timeAgo(post.createdAt)}</time>
          </Row>
          <p className="muted">{post.body}</p>
          <Row>
            <span className="caption">❤️ {post.likeCount} likes</span>
            <span className="caption">💬 {post.comments.length}</span>
          </Row>
        </Surface>
      ))}
    </Column>
  );
}
