import { useState } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import { handleCreatePost } from '@features/social';
import type { Post } from '@features/social';
import type { PostWithMeta } from '@data/mock/social';
import { PostCard } from './PostCard';
import { USER_ID, USER_NAME, USER_INITIALS } from './socialConstants';

export function FeedTab() {
  const [body, setBody] = useState('');
  const liveFeed  = (useQuery<Post[]>('social_feed') ?? []) as PostWithMeta[];
  const mockPosts = (useQuery<PostWithMeta[]>('social_posts_mock') ?? []) as PostWithMeta[];
  const { dispatch: createPost } = useCommand(handleCreatePost);

  const feed = [...liveFeed, ...mockPosts];

  const handlePost = async () => {
    if (!body.trim()) return;
    await createPost({ type: 'CreatePost', userId: USER_ID, authorName: USER_NAME, authorInitials: USER_INITIALS, body });
    setBody('');
  };

  return (
    <>
      <section className="surface">
        <div className="row space-between">
          <div className="avatar lift">{USER_INITIALS}</div>
          <input id="composer-input" placeholder="Share a workout or activity…"
            value={body} onChange={e => setBody(e.target.value)} />
        </div>
        <button className="primary sm" onClick={handlePost}>Post</button>
      </section>
      <h3>Recent Activity</h3>
      {feed.length === 0 && <p>No posts yet.</p>}
      {feed.map(item => <PostCard key={item.id} post={item} />)}
    </>
  );
}
