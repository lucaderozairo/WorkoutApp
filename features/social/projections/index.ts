import type { SocialEvent, Post } from '../domain/types';
import { ProjectionBuilder } from '@data/projections/builders';
import {
  applyPostCreated,
  applyPostLiked,
  applyPostCommented,
} from '../domain/reducers';

export const socialFeedProjection = new ProjectionBuilder<Post[], SocialEvent>(
  'social_feed',
  [],
  {
    PostCreated: applyPostCreated,
    PostLiked: applyPostLiked,
    PostCommented: applyPostCommented,
  }
);
