import type { Id } from '@shared/types';
import type { SocialEvent, Post, PostCreatedPayload, PostLikedPayload, PostCommentedPayload, Comment } from './types';

export function applyPostCreated(state: Post[], event: SocialEvent): Post[] {
  if (event.type !== 'PostCreated') return state;
  const p = event.payload as PostCreatedPayload;
  const post: Post = {
    id: p.postId,
    authorId: p.authorId,
    authorName: p.authorName,
    authorInitials: p.authorInitials,
    body: p.body,
    likeCount: 0,
    likedByMe: false,
    comments: [],
    createdAt: event.timestamp,
  };
  return [post, ...state];
}

export function applyPostLiked(state: Post[], event: SocialEvent): Post[] {
  if (event.type !== 'PostLiked') return state;
  const p = event.payload as PostLikedPayload;
  return state.map(post =>
    post.id === p.postId
      ? { ...post, likeCount: post.likeCount + 1, likedByMe: true }
      : post
  );
}

export function applyPostCommented(state: Post[], event: SocialEvent): Post[] {
  if (event.type !== 'PostCommented') return state;
  const p = event.payload as PostCommentedPayload;
  return state.map(post =>
    post.id === p.postId
      ? {
          ...post,
          comments: [
            ...post.comments,
            { id: p.commentId, authorName: p.authorName, body: p.body, createdAt: event.timestamp } as Comment,
          ],
        }
      : post
  );
}
