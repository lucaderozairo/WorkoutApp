import { Phone, Video } from "lucide-react";
import { useQuery } from '@ui/bindings';
import type { MockUpcomingCall, MockRecentMessage } from '@data/mock/messages';

export function MessageScreen() {
    const calls = (useQuery<MockUpcomingCall[]>('messages_calls') ?? []) as MockUpcomingCall[];
    const chats = (useQuery<MockRecentMessage[]>('messages_chats') ?? []) as MockRecentMessage[];

    return (
        <div className="column">
            {calls.length > 0 && (
                <section className="column compact">
                    <h3>Upcoming Calls</h3>
                    <div className="surface">
                        {calls.map(call => (
                            <div key={call.id} className="row space-between align-top">
                                <div className="row">
                                    <div className="avatar">{call.initials}</div>
                                    <div className="column compact">
                                        <p>{call.name}</p>
                                        <p className="caption">{call.date} · {call.time} · {call.durationMin} min</p>
                                    </div>
                                </div>
                                <div className="row">
                                    {call.type === 'video'
                                        ? <button className="ghost locked"><Video size={18} /></button>
                                        : <button className="ghost locked"><Phone size={18} /></button>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
            {chats.length > 0 && (
                <section className="column compact">
                    <h3>Recent Messages</h3>
                    {chats.map(chat => (
                        <div key={chat.id} className="surface">
                            <div className="row space-between">
                                <div className="row">
                                    <span className="avatar">{chat.initials}</span>
                                    <div className="column compact">
                                        <p>{chat.name}</p>
                                        {chat.unread
                                            ? <strong className="caption">{chat.preview}</strong>
                                            : <p className="caption">{chat.preview}</p>
                                        }
                                    </div>
                                </div>
                                <div className="column compact">
                                    <time className="caption">{chat.timeAgo}</time>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
}
