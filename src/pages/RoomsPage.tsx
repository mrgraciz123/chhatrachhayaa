import React, { useState, useEffect, useRef } from 'react';
import { useApp, Message, Room } from '../context/AppContext';

function Avatar({ name, role, size = 36 }: { name: string; role: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const bg = role === 'ELDER' ? '#FAEEDA' : '#EEEDFE';
  const color = role === 'ELDER' ? '#E8A020' : '#534AB7';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function ChatRoom({ room, onBack }: { room: Room; onBack: () => void }) {
  const { user, messages, sendMessage } = useApp();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgs = messages[room.id] ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(room.id, text);
    setText('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800 truncate">{room.title}</div>
          <div className="text-xs text-gray-400">{room.topic} • {msgs.length} messages</div>
        </div>
        {room.isLive && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold" style={{ background: '#FEE2E2', color: '#EF4444' }}>
            <span className="animate-pulse">●</span> LIVE
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {msgs.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <div className="text-4xl mb-2">💬</div>
            <p>Koi bhi pehla message bhejo!</p>
          </div>
        )}
        {msgs.map(msg => {
          const isMe = msg.userId === user?.id;
          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && <Avatar name={msg.userName} role={msg.userRole} size={32} />}
              <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isMe && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">{msg.userName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: msg.userRole === 'ELDER' ? '#FAEEDA' : '#EEEDFE', color: msg.userRole === 'ELDER' ? '#E8A020' : '#534AB7' }}>
                      {msg.userRole === 'ELDER' ? 'Elder ✓' : 'Student'}
                    </span>
                  </div>
                )}
                <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: isMe ? '#1D9E75' : 'white',
                    color: isMe ? 'white' : '#111',
                    borderBottomRightRadius: isMe ? 4 : undefined,
                    borderBottomLeftRadius: !isMe ? 4 : undefined,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }}>
                  {msg.text}
                </div>
                <span className="text-xs text-gray-300">{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-2">
          <input
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            placeholder="Kuch likho yahan... 💬"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: '#1D9E75' }}
          >
            <span className="text-white text-sm">↑</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoomsPage() {
  const { user, rooms, addRoom, messages } = useApp();
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');

  const handleCreate = () => {
    if (!title.trim() || !user) return;
    const room: Room = {
      id: `r_${Date.now()}`,
      title: title.trim(),
      topic: topic || 'General',
      hostName: user.name,
      hostRole: user.role,
      participantCount: 1,
      isLive: true,
      createdAt: Date.now(),
    };
    addRoom(room);
    setTitle(''); setTopic('');
    setShowCreate(false);
    setActiveRoom(room);
  };

  if (activeRoom) {
    return <ChatRoom room={activeRoom} onBack={() => setActiveRoom(null)} />;
  }

  const liveRooms = rooms.filter(r => r.isLive);
  const upcomingRooms = rooms.filter(r => !r.isLive);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Mentorship Rooms</h2>
            <p className="text-sm text-gray-400">{liveRooms.length} rooms live abhi</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-xl font-bold text-white text-sm flex items-center gap-2 hover:opacity-90 transition-all"
            style={{ background: '#1D9E75' }}
          >
            + Room Banao
          </button>
        </div>

        {showCreate && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-md border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Naya Room Banao</h3>
            <div className="space-y-3">
              <input className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-300"
                placeholder="Room ka title (e.g. UPSC 2025 Strategy)" value={title} onChange={e => setTitle(e.target.value)} />
              <input className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-300"
                placeholder="Topic (e.g. Sarkari Naukri, Tech, Banking...)" value={topic} onChange={e => setTopic(e.target.value)} />
              <div className="flex gap-3">
                <button onClick={handleCreate} disabled={!title.trim()}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-40 hover:opacity-90"
                  style={{ background: '#1D9E75' }}>
                  Room Banao 🚀
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="px-4 py-3 rounded-xl font-semibold text-gray-500 bg-gray-100 text-sm hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Rooms */}
        {liveRooms.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              <h3 className="font-semibold text-gray-600 text-sm uppercase tracking-wide">Live Now</h3>
            </div>
            <div className="space-y-3">
              {liveRooms.map(room => (
                <RoomCard key={room.id} room={room} messageCount={messages[room.id]?.length ?? 0} onClick={() => setActiveRoom(room)} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcomingRooms.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-600 text-sm uppercase tracking-wide mb-3">Coming Up</h3>
            <div className="space-y-3">
              {upcomingRooms.map(room => (
                <RoomCard key={room.id} room={room} messageCount={0} onClick={() => setActiveRoom(room)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RoomCard({ room, messageCount, onClick }: { room: Room; messageCount: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full bg-white rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Avatar name={room.hostName} role={room.hostRole} size={32} />
          <div>
            <div className="text-xs font-semibold text-gray-500">{room.hostName}</div>
            <div className="text-xs px-2 py-0.5 rounded-full font-bold inline-block"
              style={{ background: room.hostRole === 'ELDER' ? '#FAEEDA' : '#EEEDFE', color: room.hostRole === 'ELDER' ? '#E8A020' : '#534AB7' }}>
              {room.hostRole === 'ELDER' ? 'Elder' : 'Student'}
            </div>
          </div>
        </div>
        {room.isLive && (
          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#FEE2E2', color: '#EF4444' }}>🔴 LIVE</span>
        )}
      </div>
      <h3 className="font-bold text-gray-800 mb-2">{room.title}</h3>
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>#{room.topic}</span>
        <span>💬 {messageCount} messages</span>
        <span className="ml-auto font-semibold" style={{ color: '#1D9E75' }}>Join Room →</span>
      </div>
    </button>
  );
}
