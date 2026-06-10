import type { Result } from '@shared/types';
import { ok, err } from '@shared/types';
import type { CreatePost, LikePost, CommentOnPost, SocialEvent } from '../domain/types';
import { cryptoIdGenerator } from '@core/id-generator';
import { systemClock } from '@core/clock';
import { defineCommand } from '@data/define-command';
import { projectionRegistry } from '@data/projections/builders';
import { viewStore } from '@data/projections/views';
import { socialFeedProjection } from '../projections';

projectionRegistry.register('social_feed', socialFeedProjection);

export const handleCreatePost = defineCommand<CreatePost, Result<void, string>>({
  execute: async (cmd) => {
    if (!cmd.body.trim()) return { events: [], result: err('Post body is required') };

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
    return { events, result: ok(undefined) };
  },
});

export const handleLikePost = defineCommand<LikePost, Result<void, string>>({
  execute: async (cmd) => {
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
    return { events, result: ok(undefined) };
  },
});

export const handleCommentOnPost = defineCommand<CommentOnPost, Result<void, string>>({
  execute: async (cmd) => {
    if (!cmd.body.trim()) return { events: [], result: err('Comment cannot be empty') };

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
    return { events, result: ok(undefined) };
  },
});
