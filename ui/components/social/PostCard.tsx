import { useState } from 'react';
import { useExpandable } from '@ui/interactions/useExpandable';
import { useCommand } from '@ui/bindings';
import { handleLikePost, handleCommentOnPost } from '@features/social';
import type { Post } from '@features/social';
import { timeAgo } from '@ui/utils/timeAgo';
import { USER_ID, USER_NAME, SPORT_MAP } from './socialConstants';

export function PostCard({ post }: { post: Post & { sport?: string; group?: string; sessionName?: string } }) {
  const { expanded, toggle } = useExpandable();
  const [commentText, setCommentText] = useState('');
  const [showComment, setShowComment] = useState(false);
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
    <section className={`surface${expanded ? ' expanded' : ''}`}>
      <header className="row space-between">
        <div className="row">
          <div className={`avatar ${avatarClass}`}>{post.authorInitials}</div>
          <div>
            <p>{post.authorName}</p>
            <div className="cluster">
              {post.group && sport && (
                <span className={`pill ${sport.pill}`}>{sport.icon} {post.group}</span>
              )}
            </div>
          </div>
        </div>
        <time className="caption">{timeAgo(post.createdAt)}</time>
      </header>

      <div className="column">

        <p>{post.sessionName}</p>
        <p className="detail">{post.body}</p>
        {/* <button className="secondary" onClick={toggle}>
          {expanded ? '▲ Less' : '▼ Show details'}
        </button> */}
        <div className="expandable column" onClick={e => e.stopPropagation()}>
          {post.comments.length > 0 && (
            <div className="column">
              {post.comments.map(c => (
                <div key={c.id} className="row space-between">
                  <span className="caption">{c.authorName}</span>
                  <span className="caption">{c.body}</span>
                </div>
              ))}
            </div>
          )}
          {showComment && (
            <div className="column ">
              <input placeholder="Write a comment..." value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()} />
              <button className="" onClick={handleComment}>Post</button>
            </div>
          )}
        </div>
      </div>
      <footer className="row space-between">
        <div className="row">
          <button className={post.likedByMe ? 'liked ghost' : 'ghost'} onClick={handleLike}>
            {post.likedByMe ? '❤️' : '🤍'} {post.likeCount}
          </button>
          <button className='ghost' onClick={() => { setShowComment(true); if (!expanded) toggle(); }}>
            💬 {post.comments.length}
          </button>
        </div>
        <button className="ghost">⋮</button>
      </footer>
    </section>
  );
}
