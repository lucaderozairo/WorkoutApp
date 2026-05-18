import { MessageSquare } from 'lucide-react';

export function CommentLine({ text, indent }: { text: string; indent?: boolean }) {
  return (
    <div className={`row align-center${indent ? '' : ''}`}>
      <MessageSquare size={9} />
      <span className="pre-wrap">{text}</span>
    </div>
  );
}
