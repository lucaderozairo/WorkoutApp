import { useQuery } from '@ui/bindings';
import { useNavigate } from 'react-router-dom';
import type { Post } from '@features/social';
import type { Id } from '@shared/types';
import { timeAgo } from '@shared/utils/timeAgo';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';

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
  const allPosts = (useQuery('social_feed') ?? []) as SharedPost[];
  const myPosts  = allPosts.filter(p => p.authorId === USER_ID);

  if (myPosts.length === 0) {
    return (
      <Surface>
        <Text color="muted">No shared sessions yet. Share a workout from your session history.</Text>
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
              <Text>{post.sessionName ?? 'Workout'}</Text>
              {post.sport && <Text color="muted">{SPORT_LABELS[post.sport] ?? post.sport}</Text>}
            </Column>
            <Text as="time" mono color="muted">{timeAgo(post.createdAt)}</Text>
          </Row>
          <Text color="muted">{post.body}</Text>
          <Row>
            <Text size="caption">❤️ {post.likeCount} likes</Text>
            <Text size="caption">💬 {post.comments.length}</Text>
          </Row>
        </Surface>
      ))}
    </Column>
  );
}
