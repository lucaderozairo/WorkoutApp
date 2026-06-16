import { useState, useId } from 'react';
import { useCommand } from '@ui/bindings';
import { handleLikePost, handleCommentOnPost } from '@features/social';
import type { Post } from '@features/social';
import { timeAgo } from '@shared/utils/timeAgo';
import { USER_ID, USER_NAME, SPORT_MAP } from '@features/social/domain/constants';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface, Avatar, Text } from '@ui/atoms';
import { Badge, Button, ExpandableToggle, Input } from '@ui/molecules';

export function PostCard({ post }: { post: Post & { sport?: string; group?: string; sessionName?: string } }) {
  const id = useId();
  const [commentText, setCommentText] = useState('');
  const { dispatch: like } = useCommand(handleLikePost);
  const { dispatch: comment } = useCommand(handleCommentOnPost);

  const handleLike = () =>
    like({ type: 'LikePost', postId: post.id, userId: USER_ID });

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await comment({
      type: 'CommentOnPost', postId: post.id, userId: USER_ID,
      authorName: USER_NAME, body: commentText,
    });
    setCommentText('');
  };

  const sport = post.sport ? SPORT_MAP[post.sport] : null;
  const avatarClass = sport?.avatar ?? 'lift';

  return (
    <Surface>
      <ExpandableToggle id={id} />
      <Row as="header" justify="between">
        <Row>
          <Avatar name={post.authorInitials} className={avatarClass} />
          <Column>
            <Text>{post.authorName}</Text>
            <Cluster>
              {post.group && sport && (
                <Badge className={`pill ${sport.pill}`}>{sport.icon} {post.group}</Badge>
              )}
            </Cluster>
          </Column>
        </Row>
        <Text as="time" size="caption">{timeAgo(post.createdAt)}</Text>
      </Row>

      <Column>
        <Text>{post.sessionName}</Text>
        <Text size="detail">{post.body}</Text>
        <div className="expandable column">
          {post.comments.length > 0 && (
            <Column>
              {post.comments.map(c => (
                <Row key={c.id} justify="between">
                  <Text size="caption">{c.authorName}</Text>
                  <Text size="caption">{c.body}</Text>
                </Row>
              ))}
            </Column>
          )}
          <Column>
            <Input placeholder="Write a comment..." value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()} />
            <Button onClick={handleComment}>Post</Button>
          </Column>
        </div>
      </Column>
      <Row as="footer" justify="between">
        <Row>
          <Button variant="ghost" className={post.likedByMe ? 'liked' : ''} onClick={handleLike}>
            {post.likedByMe ? '❤️' : '🤍'} {post.likeCount}
          </Button>
          <label htmlFor={id} className="ghost interactive"><Row align="center">💬 {post.comments.length}</Row></label>
        </Row>
        <Button variant="ghost">⋮</Button>
      </Row>
    </Surface>
  );
}
