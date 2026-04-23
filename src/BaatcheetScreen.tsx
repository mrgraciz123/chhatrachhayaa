import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { sendNotification } from './notifications';

export default function BaatcheetScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to user's conversations
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'conversations'), 
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setConversations(data);
    });
    return () => unsubscribe();
  }, []);

  // Listen to messages for active chat
  useEffect(() => {
    if (!activeChat || !auth.currentUser) return;
    
    const q = query(
      collection(db, `conversations/${activeChat.id}/messages`),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => scrollToBottom(), 100);
      
      // Clear unread count when opening/viewing
      const myUid = auth.currentUser!.uid;
      if (activeChat.unreadCount?.[myUid] > 0) {
        updateDoc(doc(db, 'conversations', activeChat.id), {
          [`unreadCount.${myUid}`]: 0
        });
      }
    });
    return () => unsubscribe();
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !auth.currentUser || !activeChat) return;
    const myUid = auth.currentUser.uid;
    const otherUid = activeChat.participants.find((p: string) => p !== myUid);
    const text = newMessage.trim();
    setNewMessage('');
    
    try {
      await addDoc(collection(db, `conversations/${activeChat.id}/messages`), {
        uid: myUid,
        text,
        createdAt: serverTimestamp(),
        read: false
      });
      
      await updateDoc(doc(db, 'conversations', activeChat.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        [`unreadCount.${otherUid}`]: increment(1)
      });

      // Notify the other user
      sendNotification({
        recipientUid: otherUid,
        type: 'message',
        text: `📩 ${activeChat.participantNames[myUid]}: ${text.slice(0, 60)}${text.length > 60 ? '...' : ''}`,
        fromName: activeChat.participantNames[myUid],
        navigateTo: 'sessions'
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const formatTime = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (activeChat && auth.currentUser) {
    const myUid = auth.currentUser.uid;
    const otherUid = activeChat.participants.find((p: string) => p !== myUid);
    const otherName = activeChat.participantNames[otherUid] || 'User';
    const otherPhoto = activeChat.participantPhotos?.[otherUid] || '';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D0D0F', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}>
        {/* Chat Header */}
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setActiveChat(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', padding: 0 }}>
            ←
          </button>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {otherPhoto ? <img src={otherPhoto} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{color:'#fff', fontSize:16}}>{otherName.charAt(0)}</span>}
          </div>
          <div>
            <h2 className="serif-font" style={{ margin: 0, color: '#fff', fontSize: 18 }}>{otherName}</h2>
          </div>
        </div>

        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map(msg => {
            const isMe = msg.uid === myUid;
            return (
              <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{ 
                  background: isMe ? 'var(--gold-gradient)' : 'rgba(255,255,255,0.1)', 
                  color: isMe ? '#000' : '#fff', 
                  padding: '12px 16px', 
                  borderRadius: 20, 
                  borderBottomRightRadius: isMe ? 4 : 20,
                  borderBottomLeftRadius: isMe ? 20 : 4,
                  fontSize: 15,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: isMe ? 'right' : 'left', marginTop: 4, padding: '0 4px' }}>
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: 16, background: 'rgba(0,0,0,0.8)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12, alignItems: 'center', paddingBottom: 32 }}>
          <input 
            type="text" 
            placeholder="Message likhein..." 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            style={{ flex: 1, padding: '14px 20px', borderRadius: 24, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontSize: 15 }}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gold-gradient)', color: '#000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', opacity: !newMessage.trim() ? 0.5 : 1, boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}
          >
            ➤
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', paddingBottom: '100px', minHeight: '100vh', background: '#0D0D0F' }}>
      <h1 className="serif-font" style={{ fontSize: '28px', color: '#fff', margin: '0 0 4px', letterSpacing: '0.5px' }}>Baatcheet</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px' }}>Apne network se jude rahein</p>

      {/* Conversations List */}
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            Koi baatcheet nahi mili. Community se judein!
          </div>
        ) : (
          conversations.map(conv => {
            const myUid = auth.currentUser!.uid;
            const otherUid = conv.participants.find((p: string) => p !== myUid);
            const otherName = conv.participantNames[otherUid] || 'User';
            const otherPhoto = conv.participantPhotos?.[otherUid] || '';
            const unread = conv.unreadCount?.[myUid] || 0;

            return (
              <div 
                key={conv.id} 
                onClick={() => setActiveChat(conv)}
                style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {otherPhoto ? <img src={otherPhoto} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{color:'#fff', fontSize:20}}>{otherName.charAt(0)}</span>}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <h3 className="serif-font" style={{ margin: 0, color: '#fff', fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{otherName}</h3>
                    <span style={{ color: unread > 0 ? 'var(--gold-glow)' : 'var(--text-secondary)', fontSize: 12, fontWeight: unread > 0 ? 700 : 400 }}>
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, color: unread > 0 ? '#fff' : 'var(--text-secondary)', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unread > 0 ? 600 : 400 }}>
                      {conv.lastMessage || 'Nayi baatcheet shuru karein'}
                    </p>
                    {unread > 0 && (
                      <div style={{ background: 'var(--gold-glow)', color: '#000', fontSize: 11, fontWeight: 800, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 10px rgba(212,175,55,0.5)' }}>
                        {unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
