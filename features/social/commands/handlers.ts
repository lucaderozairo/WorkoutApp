import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { CreatePost, LikePost, CommentOnPost, SocialEvent } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { socialFeedProjection } from '../projections';

projectionRegistry.register('social_feed', socialFeedProjection);

export async function handleCreatePost(cmd: CreatePost): Promise<Result<void, string>> {
  if (!cmd.body.trim()) return err('Post body is required');

  const events: SocialEvent[] = [{
    type: 'PostCreated',
    aggregateId: cmd.userId,
    aggregateType: 'User',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      postId: cryptoIdGenerator.next<'Post'>(),
      authorId: cmd.userId,
      authorName: cmd.authorName,
      authorInitials: cmd.authorInitials,
      body: cmd.body.trim(),
    },
  }];

  events.forEach(e => socialFeedProjection.apply(e));
  viewStore.set('social_feed', socialFeedProjection.getState());
  return ok(undefined);
}

export async function handleLikePost(cmd: LikePost): Promise<Result<void, string>> {
  const events: SocialEvent[] = [{
    type: 'PostLiked',
    aggregateId: cmd.postId,
    aggregateType: 'Post',
    timestamp: systemClock.now(),
    version: 1,
    payload: { postId: cmd.postId, userId: cmd.userId },
  }];

  events.forEach(e => socialFeedProjection.apply(e));
  viewStore.set('social_feed', socialFeedProjection.getState());
  return ok(undefined);
}

export async function handleCommentOnPost(cmd: CommentOnPost): Promise<Result<void, string>> {
  if (!cmd.body.trim()) return err('Comment cannot be empty');

  const events: SocialEvent[] = [{
    type: 'PostCommented',
    aggregateId: cmd.postId,
    aggregateType: 'Post',
    timestamp: systemClock.now(),
    version: 1,
    payload: {
      postId: cmd.postId,
      commentId: cryptoIdGenerator.next<'Comment'>(),
      authorName: cmd.authorName,
      body: cmd.body.trim(),
    },
  }];

  events.forEach(e => socialFeedProjection.apply(e));
  viewStore.set('social_feed', socialFeedProjection.getState());
  return ok(undefined);
}
