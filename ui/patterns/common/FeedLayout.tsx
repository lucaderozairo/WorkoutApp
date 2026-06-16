import type { ReactNode } from 'react';
import { ResponsiveFrame } from '@ui/layout';

interface FeedLayoutProps {
  feed: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export function FeedLayout({ feed, aside, className }: FeedLayoutProps) {
  return (
    <ResponsiveFrame maxWidth="wide" padding="md" className={['feed-layout-frame', className].filter(Boolean).join(' ')}>
      <div className="feed-layout">
        <main className="feed-layout-main">{feed}</main>
        {aside ? <aside className="feed-layout-aside">{aside}</aside> : null}
      </div>
    </ResponsiveFrame>
  );
}
