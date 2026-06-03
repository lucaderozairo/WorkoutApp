import { Badge } from '@ui/molecules';

export function LetterBadge({ letter }: { letter: string }) {
  return <Badge className="letter-badge">{letter}</Badge>;
}
