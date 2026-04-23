import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from './App';
import { supabase } from './supabaseClient';

export default function CommunityScreen({ userRole, userName }: { userRole: UserRole, userName: string }) {
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [communities, setCommunities] = useState<any[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<any>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isInserting, setIsInserting] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch Communities
  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase.from('communities').select('*').order('created_at', { ascending: false });
      if (!error && data) setCommunities(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCommunities();
    
    // Listen for new communities
    const channel = supabase.channel('public:communities')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'communities' }, (payload) => {
        setCommunities(prev => [payload.new, ...prev]);
      }).subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Fetch Messages when a community is opened
  useEffect(() => {
    if (view !== 'chat' || !activeCommunity) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('community_id', activeCommunity.id)
        .order('created_at', { ascending: true });
      if (!error && data) {
        setMessages(data);
        scrollToBottom();
      }
    };
    fetchMessages();

    const channel = supabase.channel(`messages:${activeCommunity.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `community_id=eq.${activeCommunity.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        scrollToBottom();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [view, activeCommunity]);

  const scrollToBottom = () => {
    setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) return;
    try {
      const { data, error } = await supabase.from('communities').insert([
        { name: newCommunityName.trim(), created_by: userName || 'Anonymous' }
      ]).select();
      
      if (!error && data) {
        setShowCreateModal(false);
        setNewCommunityName('');
        // Instantly open the new community
        setActiveCommunity(data[0]);
        setView('chat');
      }
    } catch (err) {
      alert('Failed to create community. Ensure the communities table exists.');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isInserting || !activeCommunity) return;
    const textToSend = input.trim();
    setInput('');
    setIsInserting(true);

    try {
      await supabase.from('messages').insert([{
        community_id: activeCommunity.id,
        sender_id: userName || 'Anonymous',
        text: textToSend
      }]);
    } catch (err) {
      setInput(textToSend);
      alert('Failed to send message.');
    } finally {
      setIsInserting(false);
    }
  };

  if (view === 'list') {
    return (
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(10,10,10,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="serif-font" style={{ fontSize: 24, margin: 0, color: '#fff' }}>Sabha Rooms</h1>
          <p style={{ fontSize: 13, color: 'var(--gold-glow)', margin: 0 }}>Discover groups</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          style={{ background: 'var(--gold-glow)', color: '#000', border: 'none', padding: '10px 16px', borderRadius: 20, fontWeight: 700, cursor: 'pointer' }}
        >
          + New
        </button>
      </div>

        <div style={{ padding: 24, paddingBottom: 100 }}>
          {showCreateModal && (
            <div className="glass-panel animate-fade-in" style={{ padding: 20, marginBottom: 24, background: '#111', border: '1px solid #00A884' }}>
              <h3 style={{ margin: '0 0 16px', color: '#fff' }}>Name your Community</h3>
              <input 
                style={{ width: '100%', padding: 12, borderRadius: 8, background: '#202C33', border: 'none', color: '#fff', marginBottom: 16, outline: 'none' }}
                placeholder="e.g. UPSC General Studies"
                value={newCommunityName} onChange={e => setNewCommunityName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={handleCreateCommunity} style={{ flex: 1, background: '#00A884', color: '#fff', border: 'none', padding: 12, borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Create</button>
                <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, background: '#202C33', color: '#fff', border: 'none', padding: 12, borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {communities.length === 0 && !showCreateModal && (
            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No communities exist yet. Create the first one!</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {communities.map(c => (
              <div 
                key={c.id} 
                onClick={() => { setActiveCommunity(c); setView('chat'); }}
                className="glass-panel"
                style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--gold-glow)', fontWeight: 'bold' }}>
                  {c.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: '#fff' }}>{c.name}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Created by {c.created_by}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Chat View
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(10,10,10,0.8)', zIndex: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button 
          onClick={() => { setView('list'); setActiveCommunity(null); setMessages([]); }}
          style={{ background: 'none', border: 'none', color: 'var(--gold-glow)', fontSize: 24, cursor: 'pointer', padding: 0 }}
        >
          ←
        </button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-glow)', fontWeight: 'bold' }}>
          {activeCommunity?.name[0]?.toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: 18, margin: 0, color: '#fff', fontWeight: 600 }}>{activeCommunity?.name}</h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Community Chat</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: 120, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40, fontSize: 14 }}>Welcome to {activeCommunity?.name}! Start the conversation.</p>}
        
        {messages.map((m, i) => {
          const isMe = m.sender_id === userName;
          const showSenderName = !isMe && (i === 0 || messages[i-1].sender_id !== m.sender_id);
          
          return (
            <div key={m.id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              {showSenderName && <div style={{ fontSize: 12, color: 'var(--gold-glow)', marginBottom: 4, marginLeft: 12, fontWeight: 600 }}>~ {m.sender_id}</div>}
              <div style={{
                background: isMe ? 'rgba(212, 175, 55, 0.15)' : 'var(--glass-bg)', color: '#fff', padding: '8px 12px', borderRadius: 16,
                borderTopRightRadius: isMe && showSenderName ? 4 : 16, borderTopLeftRadius: !isMe && showSenderName ? 4 : 16,
                fontSize: 15, lineHeight: 1.4, border: '1px solid var(--glass-border)'
              }}>
                {m.text}
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginLeft: 12, float: 'right', marginTop: 6 }}>
                  {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ position: 'fixed', bottom: 80, left: 0, right: 0, padding: '12px 16px', background: 'rgba(10,10,10,0.8)', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', gap: 12, maxWidth: 680, margin: '0 auto', alignItems: 'center' }}>
          <div style={{ flex: 1, background: 'var(--glass-bg)', borderRadius: 24, padding: '12px 20px', display: 'flex', alignItems: 'center', border: '1px solid var(--glass-border)' }}>
            <input
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: 16, outline: 'none' }}
              placeholder="Message" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()} disabled={isInserting}
            />
          </div>
          <button 
            onClick={handleSendMessage} disabled={!input.trim() || isInserting}
            style={{ background: 'var(--gold-glow)', border: 'none', width: 48, height: 48, borderRadius: '50%', color: '#000', cursor: input.trim() ? 'pointer' : 'not-allowed', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: input.trim() ? 1 : 0.5, transform: input.trim() ? 'scale(1)' : 'scale(0.9)', transition: 'transform 0.2s' }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
