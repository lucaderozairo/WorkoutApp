import type { Id, DomainEvent } from '@shared/types';

export interface Post {
  id: Id<'Post'>;
  authorId: Id<'User'>;
  authorName: string;
  authorInitials: string;
  body: string;
  likeCount: number;
  likedByMe: boolean;
  comments: Comment[];
  createdAt: number;
}

export interface Comment {
  id: Id<'Comment'>;
  authorName: string;
  body: string;
  createdAt: number;
}

export interface SocialState {
  posts: Post[];
}

export type SocialEvent =
  | DomainEvent<'PostCreated', PostCreatedPayload>
  | DomainEvent<'PostLiked', PostLikedPayload>
  | DomainEvent<'PostCommented', PostCommentedPayload>;

export interface PostCreatedPayload {
  postId: Id<'Post'>;
  authorId: Id<'User'>;
  authorName: string;
  authorInitials: string;
  body: string;
}

export interface PostLikedPayload {
  postId: Id<'Post'>;
  userId: Id<'User'>;
}

export interface PostCommentedPayload {
  postId: Id<'Post'>;
  commentId: Id<'Comment'>;
  authorName: string;
  body: string;
}

export interface CreatePost {
  type: 'CreatePost';
  userId: Id<'User'>;
  authorName: string;
  authorInitials: string;
  body: string;
}

export interface LikePost {
  type: 'LikePost';
  postId: Id<'Post'>;
  userId: Id<'User'>;
}

export interface CommentOnPost {
  type: 'CommentOnPost';
  postId: Id<'Post'>;
  userId: Id<'User'>;
  authorName: string;
  body: string;
}

export type SocialCommand = CreatePost | LikePost | CommentOnPost;
