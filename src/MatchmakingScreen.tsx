import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendNotification } from './notifications';

export default function MatchmakingScreen({ userProfile, onMessageSent }: { userProfile: any, onMessageSent: () => void }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    fetchMatches();
  }, [userProfile]);

  const fetchMatches = async () => {
    if (!userProfile) return;
    setLoading(true);
    
    try {
      const oppositeRole = userProfile.role === 'ELDER' ? 'STUDENT' : 'ELDER';
      const q = query(collection(db, 'users'), where('role', '==', oppositeRole));
      const querySnapshot = await getDocs(q);
      
      const potentialMatches: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id === auth.currentUser?.uid) return;
        
        const myInterests = userProfile.interests || [];
        const theirInterests = data.interests || [];
        
        // Calculate shared interests
        const sharedInterests = myInterests.filter((i: string) => theirInterests.includes(i));
        
        // Calculate score
        let score = 0;
        if (sharedInterests.length > 0) {
          score += (sharedInterests.length / Math.max(myInterests.length, 1)) * 80;
        }
        if (data.city === userProfile.city) {
          score += 20; // 20 point bonus for same city
        }
        
        // Match Reason
        let reason = '';
        if (data.city === userProfile.city && sharedInterests.length > 0) {
          reason = `Dono ${data.city} se hain · ${sharedInterests[0]} mein interest match karta hai`;
        } else if (sharedInterests.length > 0) {
          reason = `${sharedInterests[0]} aur ${sharedInterests.length > 1 ? sharedInterests[1] + ' ' : ''}mein interest match karta hai`;
        } else if (data.city === userProfile.city) {
          reason = `Dono ${data.city} se hain, shayad aap ek doosre ki madad kar sakein`;
        } else {
          reason = "Naye nazariye se seekhne ka mauka";
        }

        // Only include if there's at least some match or if it's a fallback
        if (sharedInterests.length > 0 || data.city === userProfile.city) {
          potentialMatches.push({
            id: doc.id,
            ...data,
            matchScore: Math.min(Math.round(score), 99), // cap at 99%
            sharedInterests,
            matchReason: reason
          });
        }
      });
      
      // Sort by highest match score
      potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
      setMatches(potentialMatches);
    } catch (err) {
      console.error("Error fetching matches:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < matches.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // Cycle back to start
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleConnect = async () => {
    if (!auth.currentUser || !userProfile || matches.length === 0) return;
    setIsConnecting(true);
    
    try {
      const match = matches[currentIndex];
      const myUid = auth.currentUser.uid;
      const myName = userProfile.fullName || userProfile.displayName || 'Me';
      const myPhoto = userProfile.photoUrl || '';
      const myRole = userProfile.role || 'STUDENT';

      // 1. Create Conversation
      const convRef = await addDoc(collection(db, 'conversations'), {
        participants: [myUid, match.id],
        participantNames: {
          [myUid]: myName,
          [match.id]: match.fullName || match.displayName || 'User'
        },
        participantPhotos: {
          [myUid]: myPhoto,
          [match.id]: match.photoUrl || ''
        },
        participantRoles: {
          [myUid]: myRole,
          [match.id]: match.role
        },
        lastMessage: "Namaste! Main Chhatrachhaya pe aapka Shishya banna chahta hoon.",
        lastMessageAt: serverTimestamp(),
        unreadCount: {
          [myUid]: 0,
          [match.id]: 1 // Other user has 1 unread message
        }
      });
      
      // 2. Add first automated message
      await addDoc(collection(db, `conversations/${convRef.id}/messages`), {
        uid: myUid,
        text: myRole === 'STUDENT' 
          ? "Namaste! Main Chhatrachhaya pe aapka Shishya banna chahta hoon. Kya aap mujhe guide kar sakte hain?"
          : "Namaste! Main Chhatrachhaya pe Margdarshan dene ke liye yahan hoon. Kya main aapki madad kar sakta hoon?",
        createdAt: serverTimestamp(),
        read: false
      });

      // 3. Notify the connected user
      sendNotification({
        recipientUid: match.id,
        type: 'dost',
        text: `🤝 ${myName} ne aapko Dost banaya!`,
        fromName: myName,
        navigateTo: 'sessions'
      });
      
      showToast(`🎉 ${match.fullName || match.displayName} se judh gaye!`);
      
      // Navigate to chat after a brief delay to show toast
      setTimeout(() => {
        onMessageSent();
      }, 1500);

    } catch (err) {
      console.error("Error creating conversation", err);
      alert("Failed to start conversation");
    } finally {
      setIsConnecting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)' }}>
        <div className="pulse-red-dot" style={{ width: 24, height: 24, background: 'var(--gold-glow)' }}></div>
        <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Acche Margdarshak dhoondh rahe hain...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 160px)', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h2 className="serif-font" style={{ color: '#fff', margin: '0 0 8px' }}>Koi Naya Match Nahi</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Aapke interest se juda koi naya user nahi mila. Kuch der baad try karein ya apni Ruchiyan (Interests) update karein.</p>
      </div>
    );
  }

  const match = matches[currentIndex];
  const isElder = match.role === 'ELDER';

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '24px',
      minHeight: 'calc(100vh - 160px)'
    }}>
      
      {toastMsg && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: 'var(--gold-glow)', color: '#000', padding: '10px 20px', borderRadius: 24, fontWeight: 700, zIndex: 1000, animation: 'slideDown 0.3s ease-out', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)', whiteSpace: 'nowrap' }}>
          {toastMsg}
        </div>
      )}

      <div className="glass-panel animate-fade-in" style={{ width: '100%', padding: '32px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        
        {/* Glow effect behind the card */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: `radial-gradient(circle, ${isElder ? 'rgba(212, 175, 55, 0.2)' : 'rgba(99, 102, 241, 0.2)'} 0%, transparent 70%)`, borderRadius: '50%', zIndex: 0 }}></div>

        {/* Top Header - Avatar & Match Score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, marginBottom: 24 }}>
          <div style={{ 
            width: 78, height: 78, borderRadius: '50%', 
            background: isElder ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05))' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.05))', 
            border: `2px solid ${isElder ? 'rgba(212, 175, 55, 0.5)' : 'rgba(99, 102, 241, 0.5)'}`, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: isElder ? 'var(--gold-glow)' : 'var(--indigo-glow)', fontSize: 32, fontWeight: 800,
            boxShadow: `0 8px 24px ${isElder ? 'rgba(212, 175, 55, 0.2)' : 'rgba(99, 102, 241, 0.2)'}`,
            overflow: 'hidden'
          }}>
            {match.photoUrl ? <img src={match.photoUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : (match.fullName?.charAt(0) || match.displayName?.charAt(0) || 'U')}
          </div>
          
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--glass-bg)', border: `3px solid ${isElder ? 'var(--gold-glow)' : 'var(--indigo-glow)'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 16px ${isElder ? 'rgba(212, 175, 55, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`
          }}>
            <span style={{ color: isElder ? 'var(--gold-glow)' : 'var(--indigo-glow)', fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{match.matchScore}%</span>
            <span style={{ color: isElder ? 'var(--gold-glow)' : 'var(--indigo-glow)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Match</span>
          </div>
        </div>

        {/* Profile Info */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="serif-font" style={{ fontSize: 28, margin: '0 0 8px', color: '#fff', letterSpacing: '0.5px' }}>
            {match.fullName || match.displayName} {isElder && <span style={{ color: 'var(--gold-glow)', fontSize: 18 }}>✓</span>}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', fontWeight: 500, letterSpacing: '0.3px' }}>
            {isElder ? match.designation : match.educationLevel} · {match.city} {isElder ? `· ${match.yearsOfService} years exp` : ''}
          </p>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
            {match.sharedInterests.map((interest: string) => (
              <span key={interest} style={{ background: isElder ? 'rgba(212, 175, 55, 0.1)' : 'rgba(99, 102, 241, 0.1)', color: isElder ? 'var(--gold-glow)' : 'var(--indigo-glow)', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                {interest}
              </span>
            ))}
            {match.sharedInterests.length === 0 && match.interests.slice(0,2).map((interest: string) => (
              <span key={interest} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Reasoning Box (Teal accent) */}
        <div style={{ 
          background: 'rgba(20, 184, 166, 0.1)', 
          borderLeft: '4px solid #14B8A6',
          borderRadius: '12px', 
          padding: '16px', 
          marginBottom: 32,
          position: 'relative', zIndex: 1,
          textAlign: 'left'
        }}>
          <p style={{ margin: 0, fontSize: 15, color: '#CCFBF1', fontStyle: 'italic', lineHeight: 1.6, fontWeight: 400 }}>
            "{match.matchReason}"
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
          <button 
            onClick={handleConnect}
            disabled={isConnecting}
            style={{ 
              width: '100%', padding: '16px', 
              background: 'var(--gold-gradient)', color: '#000', 
              border: 'none', borderRadius: '16px', 
              fontSize: 16, fontWeight: 800, letterSpacing: '0.5px',
              boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3)',
              cursor: 'pointer', transition: 'transform 0.2s',
              opacity: isConnecting ? 0.5 : 1
            }}
          >
            {isConnecting ? 'Judh rahe hain...' : '🤝 Dost Banao'}
          </button>
          
          <button style={{ 
            width: '100%', padding: '14px', 
            background: 'transparent', color: 'var(--text-primary)', 
            border: '1px solid var(--glass-border-light)', borderRadius: '16px', 
            fontSize: 15, fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.2s'
          }}>
            👤 Profile Dekho
          </button>

          <button 
            onClick={handleNext}
            style={{ 
              width: '100%', padding: '12px', 
              background: 'transparent', color: 'var(--text-secondary)', 
              border: 'none', 
              fontSize: 14, fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Aage Badhein →
          </button>
        </div>

      </div>
    </div>
  );
}
