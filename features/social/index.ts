export type { Post, Comment, SocialEvent, SocialCommand, CreatePost, LikePost, CommentOnPost } from './domain/types';
export { socialFeedProjection } from './projections';
export { handleCreatePost, handleLikePost, handleCommentOnPost } from './commands/handlers';
export { getSocialFeed } from './queries';

export type { PostWithMeta, MockSuggestedGroup, MockSocialEvent } from './domain/mock-types';
export { USER_ID, USER_NAME, USER_INITIALS, SPORT_MAP } from './domain/constants';
