import { Phone, Video } from "lucide-react";
import { Avatar, Surface, Text } from '@ui/atoms';
import { Button } from '@ui/molecules';
import { Column, Grid, Row } from '@ui/layout';
import { useMessageScreen } from './useMessageScreen';

export function MessageScreen() {
  const { calls, chats } = useMessageScreen();

  return (
    <Grid>
      {calls.length > 0 && (
        <Column as="section" gap={1}>
          <h3>Upcoming Calls</h3>
          <Surface>
            <Column gap={1}>
              {calls.map(call => (
                <Row key={call.id} justify="between" align="start">
                  <Row>
                    <Avatar name={call.name} />
                    <Column gap={1}>
                      <p>{call.name}</p>
                      <Text as="p" size="caption">{call.date} - {call.time} - {call.durationMin} min</Text>
                    </Column>
                  </Row>
                  <Row>
                    {call.type === 'video'
                      ? <Button variant="ghost" disabled aria-label="Video call unavailable"><Video size={18} /></Button>
                      : <Button variant="ghost" disabled aria-label="Phone call unavailable"><Phone size={18} /></Button>
                    }
                  </Row>
                </Row>
              ))}
            </Column>
          </Surface>
        </Column>
      )}
      {chats.length > 0 && (
        <Column as="section" gap={1}>
          <h3>Recent Messages</h3>
          {chats.map(chat => (
            <Surface key={chat.id}>
              <Row justify="between">
                <Row>
                  <Avatar name={chat.name} />
                  <Column gap={1}>
                    <p>{chat.name}</p>
                    {chat.unread
                      ? <Text as="strong" size="caption">{chat.preview}</Text>
                      : <Text as="p" size="caption">{chat.preview}</Text>
                    }
                  </Column>
                </Row>
                <Column gap={1}>
                  <Text as="time" size="caption">{chat.timeAgo}</Text>
                </Column>
              </Row>
            </Surface>
          ))}
        </Column>
      )}
    </Grid>
  );
}
