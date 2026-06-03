// Public contract for the social feature.

// Domain events this feature publishes.
export type { SocialEvent } from './domain/types';

// Commands this feature accepts.
export type {
  SocialCommand,
  CreatePost,
  LikePost,
  CommentOnPost,
} from './domain/types';

// Domain types consumed by UI and screens.
export type { Post, Comment } from './domain/types';

// Mock view-model types consumed by data/mock and social UI.
export type {
  PostWithMeta,
  MockSuggestedGroup,
  MockSocialEvent,
} from './domain/mock-types';
