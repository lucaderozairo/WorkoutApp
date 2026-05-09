import { useState } from 'react';
import { useQuery, useCommand } from '@ui/bindings';
import { useExpandable } from '@ui/interactions/useExpandable';
import { handleCreatePost, handleLikePost, handleCommentOnPost } from '@features/social';
import type { Post } from '@features/social';
import type { Id } from '@shared/types';
import type { PostWithMeta, MockSuggestedGroup, MockSocialEvent } from '@data/mock/social';

import '@features/scheduling';
import { timeAgo } from '@ui/utils/timeAgo';

const USER_ID = 'user-001' as Id<'User'>;
const USER_NAME = 'You';
const USER_INITIALS = 'ME';

const SPORT_MAP: Record<string, { icon: string; pill: string; avatar: string }> = {
  lift: { icon: '🏋️', pill: 'lift', avatar: 'lift' },
  run: { icon: '🏃', pill: 'run', avatar: 'run' },
  cycle: { icon: '🚴', pill: 'cycle', avatar: 'cycle' },
  swim: { icon: '🏊', pill: 'swim', avatar: 'swim' },
  row: { icon: '🚣', pill: 'rowing', avatar: 'rowing' },
};

function PostCard({ post }: { post: Post & { sport?: string; group?: string; sessionName?: string } }) {
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

export function SocialScreen() {
  const [body, setBody] = useState('');
  const [activeTab, setActiveTab] = useState('feed');
  const liveFeed = (useQuery<Post[]>('social_feed') ?? []) as PostWithMeta[];
  const mockPosts = (useQuery<PostWithMeta[]>('social_posts_mock') ?? []) as PostWithMeta[];
  const mockGroups = (useQuery<MockSuggestedGroup[]>('social_groups_mock') ?? []) as MockSuggestedGroup[];
  const mockEvents = (useQuery<MockSocialEvent[]>('social_events_mock') ?? []) as MockSocialEvent[];
  const { dispatch: createPost } = useCommand(handleCreatePost);

  const feed = [...liveFeed, ...mockPosts];

  const handlePost = async () => {
    if (!body.trim()) return;
    await createPost({
      type: 'CreatePost', userId: USER_ID,
      authorName: USER_NAME, authorInitials: USER_INITIALS, body,
    });
    setBody('');
  };

  return (
    <div className="column">
      <div className="tabs">
        <button className={`tab${activeTab === 'feed' ? ' active' : ''}`} onClick={() => setActiveTab('feed')}>Feed</button>
        <button className={`tab${activeTab === 'events' ? ' active' : ''}`} onClick={() => setActiveTab('events')}>Events</button>
        <button className={`tab${activeTab === 'groups' ? ' active' : ''}`} onClick={() => setActiveTab('groups')}>Groups</button>
      </div>

      {activeTab === 'feed' && (
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
          {feed.map(item => (
            <PostCard key={item.id} post={item} />
          ))}
          <div className="surface column">
            <div className="row align-center space-between">
              <div className="row align-center">
                <div className="skeleton avatar"></div>
                <div className="column compact">
                  <p className="skeleton">Alex Runner</p>
                  <p className="skeleton pill plain">Morning Run • 8.5 km</p>
                </div>
              </div>
              <p className="skeleton detail">2h ago</p>
            </div>
            <div className="body column">
              <h3 className="skeleton">this is my big title</h3>
              <div className="skeleton media full"></div>
            </div>
            <div className="row space-between align-center">
              <div className="row">
                <button className="skeleton">Like 14</button>
                <button className="skeleton">Comment 3</button>
              </div>
              <button className="skeleton">•</button>
            </div>
          </div>
          <div className="surface column">
            <div className="row align-center space-between">
              <div className="row align-center">
                <div className="skeleton avatar"></div>
                <div className="column compact">
                  <p className="skeleton detail">Alex Runner</p>
                  <p className="skeleton caption">Morning Run • 8.5 km</p>
                </div>
              </div>
              <p className="skeleton detail">2h ago</p>
            </div>
            <div className="body column">
              <h3 className="skeleton">this is my big title</h3>
              <div className="skeleton media full"></div>
            </div>
            <div className="row space-between align-center">
              <div className="row">
                <button className="skeleton">Like 14</button>
                <button className="skeleton">Comment 3</button>
              </div>
              <button className="skeleton">•••</button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'events' && (
        <>
          <section className="surface">
            <h3>Upcoming Events</h3>
            <div className="column">
              {mockEvents.map(ev => {
                const sport = SPORT_MAP[ev.sport];
                return (
                  <div key={ev.id} className="row space-between">
                    <div className="row">
                      <div className={`avatar ${sport?.avatar ?? 'lift'}`}>{sport?.icon}</div>
                      <div>
                        <p>{ev.name}</p>
                        <time className="caption">{ev.date} · {ev.location} · {ev.time}</time>
                      </div>
                    </div>
                    <button className="">Join</button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {activeTab === 'groups' && (
        <section className="surface">
          <h3>Suggested Groups</h3>
          <div className="column ">
            {mockGroups.map(g => {
              const sport = SPORT_MAP[g.sport];
              return (
                <div key={g.id} className="row space-between">
                  <div className="row">
                    <div className={`avatar ${sport?.avatar ?? 'lift'}`}>{g.initials}</div>
                    <div>
                      <p>{g.name}</p>
                      <span className="caption">{g.members} members · {g.activity}</span>
                    </div>
                  </div>
                  <button className="sm">Join</button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
