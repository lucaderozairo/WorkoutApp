import { Badge } from '@ui/atoms';

export function LetterBadge({ letter }: { letter: string }) {
  return <Badge className="letter-badge">{letter}</Badge>;
}
