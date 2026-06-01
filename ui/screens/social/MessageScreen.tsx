import { Phone, Video } from "lucide-react";
import { Avatar, Button, Surface } from '@ui/atoms';
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
                      <p className="caption">{call.date} - {call.time} - {call.durationMin} min</p>
                    </Column>
                  </Row>
                  <Row>
                    {call.type === 'video'
                      ? <Button variant="ghost" className="locked"><Video size={18} /></Button>
                      : <Button variant="ghost" className="locked"><Phone size={18} /></Button>
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
                      ? <strong className="caption">{chat.preview}</strong>
                      : <p className="caption">{chat.preview}</p>
                    }
                  </Column>
                </Row>
                <Column gap={1}>
                  <time className="caption">{chat.timeAgo}</time>
                </Column>
              </Row>
            </Surface>
          ))}
        </Column>
      )}
    </Grid>
  );
}
