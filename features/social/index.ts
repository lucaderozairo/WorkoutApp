export type { Post, Comment, SocialEvent, SocialCommand, CreatePost, LikePost, CommentOnPost } from './domain/types';
export { socialFeedProjection } from './projections';
export { handleCreatePost, handleLikePost, handleCommentOnPost } from './commands/handlers';
export { getSocialFeed } from './queries';
