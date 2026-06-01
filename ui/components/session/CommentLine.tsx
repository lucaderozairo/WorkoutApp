import { MessageSquare } from 'lucide-react';
import { Row } from '@ui/layout';
import { Text } from '@ui/atoms';

export function CommentLine({ text }: { text: string; indent?: boolean }) {
  return (
    <Row align="center">
      <MessageSquare size={9} />
      <Text className="pre-wrap">{text}</Text>
    </Row>
  );
}
