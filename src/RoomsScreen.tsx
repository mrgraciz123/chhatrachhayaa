import React, { useState, useEffect } from 'react';
import { UserRole } from './App';
import { db, auth } from './firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';

const TOPICS = ["UPSC", "Banking", "Tech", "Career", "Life", "Mental Health", "Business"];
const TYPES = ["Voice Sabha", "AMA", "Study Circle"];

export default function RoomsScreen({ userRole, userName, userProfile }: { userRole: UserRole, userName: string, userProfile?: any }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Room Creation State
  const [title, setTitle] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [topic, setTopic] = useState(TOPICS[0]);
  
  // Active Room State
  const [activeRoom, setActiveRoom] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Listen to Live Rooms
  useEffect(() => {
    const q = query(collection(db, 'rooms'), where('status', '==', 'live'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in JS instead of compound index to avoid missing index errors
      data.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setRooms(data);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Active Room Members
  useEffect(() => {
    if (!activeRoom) return;
    const unsubscribe = onSnapshot(collection(db, `rooms/${activeRoom.id}/members`), (snapshot) => {
      const mems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(mems);
      
      // Also update the active room's member count locally for immediate UI update
      setActiveRoom((prev: any) => prev ? { ...prev, memberCount: mems.length } : null);
    });
    return () => unsubscribe();
  }, [activeRoom?.id]);

  // Mock Voice Activity Detection
  useEffect(() => {
    if (!activeRoom || isMuted) {
      setIsSpeaking(false);
      return;
    }
    const interval = setInterval(() => {
      setIsSpeaking(Math.random() > 0.6); // Randomly trigger speaking state
    }, 1500);
    return () => clearInterval(interval);
  }, [activeRoom, isMuted]);

  const handleCreate = async () => {
    if (!title.trim() || !auth.currentUser) return;
    setIsCreating(true);
    try {
      const roomRef = await addDoc(collection(db, 'rooms'), {
        title: title.trim(),
        type,
        topic,
        hostUid: auth.currentUser.uid,
        hostName: userName || 'Anonymous',
        hostPhoto: userProfile?.photoUrl || '',
        status: 'live',
        createdAt: serverTimestamp(),
        memberCount: 0
      });
      setShowModal(false);
      setTitle('');
      // Auto join the room we just created
      joinRoom({ id: roomRef.id, hostUid: auth.currentUser.uid });
    } catch (e) {
      console.error(e);
      alert('Failed to create Chaupal');
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async (room: any) => {
    if (!auth.currentUser) return;
    setActiveRoom(room);
    try {
      const memberRef = doc(db, `rooms/${room.id}/members`, auth.currentUser.uid);
      await setDoc(memberRef, {
        uid: auth.currentUser.uid,
        name: userName || 'Anonymous',
        role: userRole,
        photoURL: userProfile?.photoUrl || '',
        joinedAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'rooms', room.id), {
        memberCount: increment(1)
      });
    } catch (err) {
      console.error("Error joining room:", err);
    }
  };

  const leaveRoom = async () => {
    if (!auth.currentUser || !activeRoom) return;
    const roomId = activeRoom.id;
    setActiveRoom(null);
    try {
      await deleteDoc(doc(db, `rooms/${roomId}/members`, auth.currentUser.uid));
      await updateDoc(doc(db, 'rooms', roomId), {
        memberCount: increment(-1)
      });
      // In a real app, if memberCount == 0, we could set status = 'ended'
    } catch (err) {
      console.error("Error leaving room:", err);
    }
  };

  if (activeRoom) {
    const host = members.find(m => m.uid === activeRoom.hostUid) || { name: activeRoom.hostName, photoURL: activeRoom.hostPhoto, role: 'ELDER' };
    const audience = members.filter(m => m.uid !== activeRoom.hostUid);

    return (
      <div style={{ padding: 16, animation: 'fadeIn 0.3s' }}>
        {/* Active Room Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 20 }}>
          <div>
            <div style={{ color: 'var(--live-red)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
               <span className="pulse-red-dot" style={{ width: 8, height: 8, background: 'var(--live-red)', borderRadius: '50%' }}></span>
               LIVE CHAUPAL
            </div>
            <h2 className="serif-font" style={{ color: '#fff', fontSize: 22, margin: '0 0 4px' }}>{activeRoom.title}</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {activeRoom.topic} • {activeRoom.memberCount} Shamil
            </div>
          </div>
          <button onClick={leaveRoom} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '6px 12px', borderRadius: 16, fontWeight: 700, cursor: 'pointer' }}>
            Chhod Do
          </button>
        </div>

        {/* Host Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ 
              width: 100, height: 100, borderRadius: '50%', background: '#333', 
              border: `4px solid ${host.role === 'ELDER' ? 'var(--gold-glow)' : 'var(--indigo-glow)'}`,
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 20px ${host.role === 'ELDER' ? 'rgba(212,175,55,0.3)' : 'rgba(99,102,241,0.3)'}`,
              transition: 'all 0.2s',
              // Host always speaks occasionally in our mock
              transform: Math.random() > 0.5 ? 'scale(1.05)' : 'scale(1)'
            }}>
               {host.photoURL ? <img src={host.photoURL} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{color:'#fff', fontSize:36}}>{host.name?.charAt(0)}</span>}
            </div>
            <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', background: host.role === 'ELDER' ? 'var(--gold-glow)' : 'var(--indigo-glow)', color: '#000', padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
              HOST
            </div>
          </div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginTop: 16 }}>{host.name}</div>
        </div>

        {/* Audience Grid */}
        <h3 className="serif-font" style={{ color: 'var(--text-secondary)', fontSize: 16, margin: '0 0 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>Sun Rahe Hain ({audience.length})</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 16 }}>
          {audience.map(m => {
            const isMe = m.uid === auth.currentUser?.uid;
            const userSpeaking = isMe ? isSpeaking : Math.random() > 0.8;
            return (
              <div key={m.id} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'slideInRight 0.3s ease-out' }}>
                <div style={{ 
                  width: 56, height: 56, borderRadius: '50%', background: '#222', 
                  border: userSpeaking ? '3px solid #4ADE80' : '2px solid transparent',
                  boxShadow: userSpeaking ? '0 0 15px rgba(74,222,128,0.4)' : 'none',
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}>
                  {m.photoURL ? <img src={m.photoURL} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{color:'#fff', fontSize:20}}>{m.name?.charAt(0)}</span>}
                </div>
                <div style={{ color: '#E2E8F0', fontSize: 11, marginTop: 8, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                  {m.name.split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Controls */}
        <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 16, zIndex: 100 }}>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            style={{ width: 56, height: 56, borderRadius: '50%', background: isMuted ? 'rgba(255,255,255,0.1)' : '#fff', color: isMuted ? '#fff' : '#000', border: '1px solid rgba(255,255,255,0.2)', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
          >
            {isMuted ? '🔇' : '🎙️'}
          </button>
          <button style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            ✋
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ padding: 16, paddingBottom: 120 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 className="serif-font" style={{ fontSize: 28, margin: '0 0 4px', color: '#fff' }}>Chaupal</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>Real-time voice rooms</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            style={{ background: 'var(--gold-gradient)', color: '#000', border: 'none', padding: '10px 16px', borderRadius: 20, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(212,175,55,0.3)' }}
          >
            + Naya Chaupal Banao
          </button>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {rooms.map((room) => (
            <div key={room.id} className="premium-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: 'var(--gold-glow)', fontSize: 12, fontWeight: 700, background: 'rgba(212,175,55,0.1)', padding: '4px 8px', borderRadius: 8 }}>{room.topic}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="pulse-red-dot" style={{ width: 6, height: 6, background: 'var(--live-red)', borderRadius: '50%' }}></span>
                  <span style={{ color: 'var(--live-red)', fontSize: 12, fontWeight: 700, letterSpacing: '1px' }}>{room.type.toUpperCase()}</span>
                </div>
              </div>
              
              <h3 className="serif-font" style={{ fontSize: 20, margin: '0 0 16px', color: '#fff', lineHeight: 1.4 }}>
                {room.title}
              </h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {room.hostPhoto ? <img src={room.hostPhoto} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{color:'#fff', fontSize:14}}>{room.hostName?.charAt(0)}</span>}
                   </div>
                   <div>
                     <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{room.hostName}</div>
                     <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Host</div>
                   </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                    👥 {room.memberCount} Shamil
                  </div>
                  <button onClick={() => joinRoom(room)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 20px', borderRadius: 16, fontWeight: 700, cursor: 'pointer' }}>
                    Shamil Hoon
                  </button>
                </div>
              </div>
            </div>
          ))}
          {rooms.length === 0 && (
             <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
               Abhi koi live Chaupal nahi hai. Naya shuru karein!
             </div>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1A1A1D', width: '90%', maxWidth: '400px', borderRadius: 24, padding: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 className="serif-font" style={{ color: '#fff', margin: 0, fontSize: 24 }}>Naya Chaupal</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input 
                placeholder="Room Title (e.g. UPSC Prelims Strategy)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ padding: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', outline: 'none' }}
              />
              
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8, display: 'block' }}>Type</label>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                  {TYPES.map(t => (
                    <button key={t} onClick={() => setType(t)} style={{ padding: '6px 12px', borderRadius: 16, background: type === t ? 'var(--gold-glow)' : 'rgba(255,255,255,0.05)', color: type === t ? '#000' : '#fff', border: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8, display: 'block' }}>Topic</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {TOPICS.map(t => (
                    <button key={t} onClick={() => setTopic(t)} style={{ padding: '6px 12px', borderRadius: 16, background: topic === t ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', fontSize: 13 }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={handleCreate}
                disabled={!title.trim() || isCreating}
                style={{ background: 'var(--gold-gradient)', color: '#000', padding: 16, borderRadius: 16, fontWeight: 800, fontSize: 16, marginTop: 16, border: 'none', cursor: 'pointer', opacity: (!title.trim() || isCreating) ? 0.5 : 1 }}
              >
                {isCreating ? 'Creating...' : 'Chaupal Shuru Karo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
