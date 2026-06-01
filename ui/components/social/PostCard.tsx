import { useState, useId } from 'react';
import { useCommand } from '@ui/bindings';
import { handleLikePost, handleCommentOnPost } from '@features/social';
import type { Post } from '@features/social';
import { timeAgo } from '@shared/utils/timeAgo';
import { USER_ID, USER_NAME, SPORT_MAP } from '@features/social/domain/constants';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface } from '@ui/atoms';

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
      <input type="checkbox" id={id} className="exp-toggle" />
      <Row as="header" justify="between">
        <Row>
          <div className={`avatar ${avatarClass}`}>{post.authorInitials}</div>
          <div>
            <p>{post.authorName}</p>
            <Cluster>
              {post.group && sport && (
                <span className={`pill ${sport.pill}`}>{sport.icon} {post.group}</span>
              )}
            </Cluster>
          </div>
        </Row>
        <time className="caption">{timeAgo(post.createdAt)}</time>
      </Row>

      <Column>

        <p>{post.sessionName}</p>
        <p className="detail">{post.body}</p>
        <div className="expandable column">
          {post.comments.length > 0 && (
            <Column>
              {post.comments.map(c => (
                <Row key={c.id} justify="between">
                  <span className="caption">{c.authorName}</span>
                  <span className="caption">{c.body}</span>
                </Row>
              ))}
            </Column>
          )}
          <Column>
            <input placeholder="Write a comment..." value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()} />
            <button className="" onClick={handleComment}>Post</button>
          </Column>
        </div>
      </Column>
      <Row as="footer" justify="between">
        <Row>
          <button className={post.likedByMe ? 'liked ghost' : 'ghost'} onClick={handleLike}>
            {post.likedByMe ? '❤️' : '🤍'} {post.likeCount}
          </button>
          <label htmlFor={id} className="ghost interactive"><Row align="center">💬 {post.comments.length}</Row></label>
        </Row>
        <button className="ghost">⋮</button>
      </Row>
    </Surface>
  );
}
