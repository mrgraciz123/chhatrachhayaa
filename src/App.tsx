import React, { useState } from 'react';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, onSnapshot, writeBatch } from 'firebase/firestore';
import { ref, onValue, onDisconnect, set, push } from "firebase/database";
import { auth, db, rtdb } from './firebase';
import { sendWelcomeEmail } from './emailService';

import FeedScreen from './FeedScreen';
import RoomsScreen from './RoomsScreen';
import MatchmakingScreen from './MatchmakingScreen';
import CommunityScreen from './CommunityScreen';
import ProfileScreen from './ProfileScreen';
import OnboardingScreen from './OnboardingScreen';
import BaatcheetScreen from './BaatcheetScreen';
import AiChatbot from './AiChatbot';

export type UserRole = 'ELDER' | 'STUDENT';

function AuthScreen({ onNext }: { onNext: (name: string) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const handleAuth = async () => {
    setErrorMsg('');
    if (!isLogin && password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    if (!email || !password) {
      setErrorMsg('Email aur password zaroor bharein');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        onNext(name);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        onNext(name);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setErrorMsg('Email ya password galat hai');
      } else if (err.code === 'auth/user-not-found') {
        setErrorMsg('Yeh account nahi mila');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Yeh email pehle se registered hai');
      } else {
        setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onNext('');
    } catch (err: any) {
      // Silently ignore if user just closed the popup
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      setErrorMsg(`Google Sign-In failed (${err.code}). Please try again.`);
    }
  };

  const inputStyle = { padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: 16, outline: 'none', width: '100%', boxSizing: 'border-box' as const };

  return (
    <div style={{ padding: 24, paddingTop: '100px', maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, var(--gold-glow), var(--gold-dark))', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 40, boxShadow: '0 8px 32px rgba(212, 175, 55, 0.4)' }}>
        🪔
      </div>
      
      <h1 className="serif-font" style={{ fontSize: 36, color: '#fff', marginBottom: 8, letterSpacing: '1px' }}>
        {isLogin ? "Chhatrachhaya" : "Chhatrachhaya Mein Judiye"}
      </h1>
      
      {isLogin ? (
        <p style={{ color: 'var(--gold-glow)', marginBottom: 40, letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: 12, fontWeight: 700 }}>
          Buzurgon ki wisdom, naujawanon ka sapna
        </p>
      ) : (
        <div style={{ height: 24 }}></div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Google Sign In Button - PRIMARY */}
        <button onClick={handleGoogleSignIn} style={{ padding: '16px 20px', background: '#fff', color: '#000', borderRadius: 16, fontWeight: 700, border: 'none', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 4px 12px rgba(255,255,255,0.1)' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 20, height: 20 }} />
          Google se Judiye
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '8px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>ya</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        {!isLogin && <input placeholder="Poora Naam" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />}
        <input type="email" placeholder="Aapka Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        
        <div style={{ position: 'relative' }}>
          <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
          <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16 }}>
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        {!isLogin && (
          <input type={showPassword ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
        )}
        
        {/* Inline Error Message */}
        {errorMsg && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', padding: '10px 14px', borderRadius: 12, fontSize: 13, textAlign: 'left' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <button onClick={handleAuth} style={{ padding: '16px 20px', background: 'var(--gold-gradient)', color: '#000', borderRadius: 16, fontWeight: 800, border: 'none', fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3)', marginTop: 8 }}>
          {loading ? '...' : (isLogin ? 'Andar Aaiye' : 'Khaata Banayein')}
        </button>
      </div>
      
      <button onClick={() => setIsLogin(!isLogin)} style={{ marginTop: 24, background: 'none', border: 'none', color: 'var(--text-secondary)', width: '100%', fontSize: 14, cursor: 'pointer' }}>
        {isLogin ? "Naye hain? Judiye Hamare Saath" : "Pehle se hain? Sign in karein"}
      </button>
    </div>
  );
}

function RoleScreen({ onSelect, onCancel }: { onSelect: (role: UserRole) => void, onCancel: () => void }) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setTimeout(() => {
      onSelect(role);
    }, 600);
  };

  return (
    <div style={{ padding: 24, paddingTop: '80px', maxWidth: 480, margin: '0 auto', textAlign: 'left', minHeight: '100vh', background: '#0D0D0F', position: 'relative' }}>
      <button onClick={onCancel} style={{ position: 'absolute', top: 24, left: 24, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Peeche Jayein
      </button>
      <h1 className="serif-font" style={{ fontSize: 32, marginBottom: 8, color: '#fff', letterSpacing: '0.5px' }}>Select your path</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15 }}>Aap kis roop mein judna chahte hain?</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Margdarshak Card */}
        <div 
          onClick={() => handleSelect('ELDER')}
          style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.03)',
            border: selectedRole === 'ELDER' ? '2px solid #E8A020' : '1px solid rgba(232, 160, 32, 0.3)',
            borderRadius: 24,
            padding: '24px 24px 32px',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: selectedRole === 'ELDER' ? 'scale(1.02)' : 'scale(1)',
            boxShadow: selectedRole === 'ELDER' ? '0 12px 32px rgba(232, 160, 32, 0.2)' : '0 8px 24px rgba(0,0,0,0.4)',
            overflow: 'hidden'
          }}
        >
          {selectedRole === 'ELDER' && (
            <div style={{ position: 'absolute', top: 20, right: 20, background: '#E8A020', color: '#000', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold', animation: 'fadeIn 0.3s' }}>
              ✓
            </div>
          )}
          <div style={{ fontSize: 48, marginBottom: 16 }}>👴</div>
          <h2 style={{ fontSize: 24, color: '#E8A020', margin: '0 0 8px', fontWeight: 700 }}>Main Margdarshak Hoon</h2>
          <p style={{ fontSize: 15, color: '#fff', margin: '0 0 20px', lineHeight: 1.4, fontWeight: 400 }}>Main anubhav share karna chahta hoon</p>
          <div style={{ display: 'inline-block', background: 'rgba(232, 160, 32, 0.1)', color: '#E8A020', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
            60+ · Sewa-nivrit Professional
          </div>
        </div>

        {/* Shishya Card */}
        <div 
          onClick={() => handleSelect('STUDENT')}
          style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.03)',
            border: selectedRole === 'STUDENT' ? '2px solid #7C6EDA' : '1px solid rgba(124, 110, 218, 0.3)',
            borderRadius: 24,
            padding: '24px 24px 32px',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: selectedRole === 'STUDENT' ? 'scale(1.02)' : 'scale(1)',
            boxShadow: selectedRole === 'STUDENT' ? '0 12px 32px rgba(124, 110, 218, 0.2)' : '0 8px 24px rgba(0,0,0,0.4)',
            overflow: 'hidden'
          }}
        >
          {selectedRole === 'STUDENT' && (
            <div style={{ position: 'absolute', top: 20, right: 20, background: '#E8A020', color: '#000', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold', animation: 'fadeIn 0.3s' }}>
              ✓
            </div>
          )}
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧑</div>
          <h2 style={{ fontSize: 24, color: '#7C6EDA', margin: '0 0 8px', fontWeight: 700 }}>Main Shishya Hoon</h2>
          <p style={{ fontSize: 15, color: '#fff', margin: '0 0 20px', lineHeight: 1.4, fontWeight: 400 }}>Main seekhna aur aage badhna chahta hoon</p>
          <div style={{ display: 'inline-block', background: 'rgba(124, 110, 218, 0.1)', color: '#7C6EDA', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
            16–24 · Career Dhundhne Wala
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState<'auth' | 'role' | 'onboarding' | 'done'>('auth');
  const [role, setRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState('');
  
  // Using the exact tabs from your prototype
  const [currentTab, setCurrentTab] = useState<'feed' | 'rooms' | 'chat' | 'match' | 'sessions' | 'profile'>('feed');
  const [showAi, setShowAi] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [onlineCount, setOnlineCount] = useState(1);
  const [onlineUsersList, setOnlineUsersList] = useState<any[]>([]);
  const [showOnlineUsersSheet, setShowOnlineUsersSheet] = useState(false);
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifSheet, setShowNotifSheet] = useState(false);

  React.useEffect(() => {
    // Listen to all online users regardless of auth state
    const presenceRef = ref(rtdb, "presence");
    const unsubOnline = onValue(presenceRef, (snap) => {
      const users: any[] = [];
      snap.forEach(childSnap => {
        users.push(childSnap.val());
      });
      setOnlineUsersList(users);
      setOnlineCount(Math.max(1, users.length));
    });

    return () => unsubOnline();
  }, []);

  React.useEffect(() => {
    if (!auth.currentUser || !userProfileData) return;

    // Realtime Presence System for Authenticated User
    const connectedRef = ref(rtdb, ".info/connected");
    const myPresenceRef = ref(rtdb, `presence/${auth.currentUser.uid}`);
    
    const unsubConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // Automatically remove node when user closes tab/disconnects
        onDisconnect(myPresenceRef).remove();
        // Set full profile node
        set(myPresenceRef, {
          uid: auth.currentUser!.uid,
          name: userProfileData.fullName || userProfileData.displayName || 'Anonymous',
          role: userProfileData.role || 'STUDENT',
          city: userProfileData.city || 'Unknown',
          photoUrl: userProfileData.photoUrl || '',
          online: true,
          lastSeen: Date.now()
        });
      }
    });

    return () => unsubConnected();
  }, [userProfileData]);

  React.useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const q = query(
      collection(db, 'users', uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [auth.currentUser]);



  React.useEffect(() => {
    // Premium splash delay
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'users', uid, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  };

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setIsCheckingProfile(true);
      if (user) {
        try {
          // Race Firestore fetch against a 5-second timeout so app never hangs
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          );
          const fetchPromise = getDoc(doc(db, 'users', user.uid));
          const userDoc = await Promise.race([fetchPromise, timeoutPromise]) as any;

          if (userDoc && userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role);
            const nameToUse = userData.displayName || userData.fullName || user.displayName || user.email?.split('@')[0] || '';
            setUserName(nameToUse);
            setUserProfileData(userData);
            setStep('done');
            localStorage.setItem('chhatrachhaya_completed', 'true');

            // Trigger Email for returning user if not sent this session
            if (user.email && !sessionStorage.getItem('login_mail_sent')) {
              sendWelcomeEmail(nameToUse, user.email, userData.role, false);
              sessionStorage.setItem('login_mail_sent', 'true');
            }
          } else {
            // New user — send to role selection
            setUserName(user.displayName || user.email?.split('@')[0] || '');
            setStep('role');
          }
        } catch (err: any) {
          // Offline or timeout — fall back gracefully
          console.warn('Firestore unreachable, using local fallback:', err.message);
          setUserName(user.displayName || user.email?.split('@')[0] || '');
          if (localStorage.getItem('chhatrachhaya_completed') === 'true') {
            setStep('done');
          } else {
            setStep('role');
          }
        }
      } else {
        setStep('auth');
        setRole(null);
        setUserName('');
        setUserProfileData(null);
        localStorage.removeItem('chhatrachhaya_completed');
      }
      setIsCheckingProfile(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setStep('auth');
    setRole(null);
    setUserName('');
    setUserProfileData(null);
    // Keep the completion flag so returning users aren't forced back into onboarding after logout
    // localStorage.removeItem('chhatrachhaya_completed'); // intentionally disabled
  };

  const handleOnboardingComplete = async (onboardingData: any) => {
    // Provide immediate UI feedback
    setStep('done');
    setUserName(onboardingData.displayName || onboardingData.fullName);
    localStorage.setItem('chhatrachhaya_completed', 'true');

    if (auth.currentUser) {
      try {
        const userProfile = {
          ...onboardingData,
          role: role,
          updatedAt: serverTimestamp(), // Use Firestore serverTimestamp for better compatibility
        };
        setUserProfileData(userProfile);
        await setDoc(doc(db, 'users', auth.currentUser.uid), userProfile);
        
        // Trigger Welcome Email (New User)
        if (auth.currentUser.email) {
          sendWelcomeEmail(
            userProfile.fullName || userProfile.displayName, 
            auth.currentUser.email, 
            role,
            true
          );
          sessionStorage.setItem('login_mail_sent', 'true');
        }
      } catch (err) {
        console.error("Error saving profile to Firestore:", err);
        // We've already set step to 'done' so the user can use the app, 
        // but we might want to alert them or retry in the background.
      }
    }
  };

  if (showSplash) {
    return (
      <div className="splash-container">
        <div className="splash-logo serif-font" style={{ color: 'var(--gold-glow)' }}>🪔</div>
        <h2 className="serif-font" style={{ color: '#fff', marginTop: 20, letterSpacing: 2 }}>CHHATRACHHAYA</h2>
        <div className="splash-loader">
          <div className="splash-progress"></div>
        </div>
      </div>
    );
  }

  if (step === 'done' && role) {
    return (
      <div className="mobile-container" style={{ paddingBottom: 70 }}>
        {/* Universal Top Header */}
        <div style={{ padding: '16px', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--gold-glow), var(--gold-dark))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 20 }}>
                🪔
              </div>
              <div>
                <h1 className="serif-font" style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>Chhatrachhaya</h1>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Buzurgon ki wisdom, naujawanon ka sapna</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Notification Bell */}
              <div onClick={() => setShowNotifSheet(true)} style={{ position: 'relative', cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                <span style={{ fontSize: 18 }}>🔔</span>
                {unreadNotifCount > 0 && (
                  <div style={{ position: 'absolute', top: -4, right: -4, background: 'var(--gold-glow)', color: '#000', fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(212,175,55,0.6)' }}>
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </div>
                )}
              </div>
              {/* Online counter */}
              <div onClick={() => setShowOnlineUsersSheet(true)} style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#4ADE80', padding: '6px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <span className="pulse-red-dot" style={{ width: 8, height: 8, background: '#4ADE80', borderRadius: '50%', boxShadow: '0 0 8px #4ADE80' }}></span>
                {onlineCount} online
              </div>
            </div>
          </div>
        </div>

        {/* Screen Content - WIRED TO YOUR REAL DATABASE COMPONENTS */}
        {currentTab === 'feed' && <FeedScreen userRole={role} userName={userName} userProfile={userProfileData} />}
        {currentTab === 'rooms' && <RoomsScreen userRole={role} userName={userName} userProfile={userProfileData} />}
        {currentTab === 'chat' && <CommunityScreen userRole={role} userName={userName} />}
        
        {/* Mocked remaining tabs until we wire them up */}
        {currentTab === 'match' && <MatchmakingScreen userProfile={userProfileData} onMessageSent={() => setCurrentTab('sessions')} />}
        {currentTab === 'sessions' && <BaatcheetScreen />}
        {currentTab === 'profile' && <ProfileScreen userName={userName} userRole={role} onLogout={handleLogout} />}

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          <Tab icon="🏠" label="Gyan Ki Baat" id="feed" current={currentTab} set={setCurrentTab} />
          <Tab icon="🎙" label="Chaupal" id="rooms" current={currentTab} set={setCurrentTab} />
          <Tab icon="🤝" label="Mera Dost" id="match" current={currentTab} set={setCurrentTab} isCenter={true} />
          <Tab icon="📅" label="Baatcheet" id="sessions" current={currentTab} set={setCurrentTab} />
          <Tab icon="👤" label="Parichay" id="profile" current={currentTab} set={setCurrentTab} />
        </div>
        {/* Floating AI Button */}
        <div style={{ position: 'fixed', bottom: '100px', right: '20px', zIndex: 150 }}>
          <button 
            onClick={() => setShowAi(true)}
            className="floating"
            style={{ 
              width: '64px', height: '64px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, #E8A020, #B37A10)', 
              border: '2px solid rgba(255,255,255,0.3)', 
              boxShadow: '0 8px 32px rgba(212,175,55,0.6)', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '32px', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            🤖
          </button>
        </div>

        {/* AI Chatbot Overlay */}
        {showAi && <AiChatbot onClose={() => setShowAi(false)} />}

        {/* Online Users Bottom Sheet */}
        {showOnlineUsersSheet && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={() => setShowOnlineUsersSheet(false)}>
            <div style={{ background: '#1A1A1D', width: '100%', maxWidth: '480px', margin: '0 auto', maxHeight: '60%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
              <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 16px' }}></div>
              <h2 className="serif-font" style={{ color: '#fff', fontSize: 20, margin: '0 0 16px' }}>Abhi Online Hain</h2>
              
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {onlineUsersList.map(u => (
                  <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 16 }}>
                     <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {u.photoUrl ? <img src={u.photoUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{color:'#fff', fontSize:18}}>{u.name?.charAt(0) || '?'}</span>}
                     </div>
                     <div style={{ flex: 1 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                         <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{u.name}</span>
                         <span style={{ background: u.role === 'ELDER' ? 'rgba(232,160,32,0.1)' : 'rgba(124,110,218,0.1)', color: u.role === 'ELDER' ? '#E8A020' : '#7C6EDA', padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
                           {u.role === 'ELDER' ? 'Margdarshak' : 'Shishya'}
                         </span>
                       </div>
                       <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
                         {u.city} • {Math.floor((Date.now() - (u.lastSeen || Date.now())) / 60000) === 0 ? 'abhi aaye' : `${Math.floor((Date.now() - (u.lastSeen || Date.now())) / 60000)} min se online`}
                       </div>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notification Center Bottom Sheet */}
        {showNotifSheet && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={() => setShowNotifSheet(false)}>
            <div style={{ background: '#1A1A1D', width: '100%', maxWidth: '480px', margin: '0 auto', maxHeight: '70%', borderTopLeftRadius: 24, borderTopRightRadius: 24, display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 className="serif-font" style={{ color: '#fff', fontSize: 20, margin: 0 }}>Notifications</h2>
                  {unreadNotifCount > 0 && <div style={{ background: 'var(--gold-glow)', color: '#000', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 12 }}>{unreadNotifCount} naya</div>}
                </div>
                {unreadNotifCount > 0 && (
                  <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--gold-glow)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Sab padha ✓
                  </button>
                )}
              </div>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>Abhi koi notification nahi</div>
                ) : (
                  notifications.map(n => {
                    const time = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
                    const minutesAgo = Math.floor((Date.now() - time.getTime()) / 60000);
                    return (
                      <div
                        key={n.id}
                        onClick={() => { setShowNotifSheet(false); setCurrentTab(n.navigateTo || 'feed'); }}
                        style={{ display: 'flex', gap: 14, padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(212,175,55,0.04)', transition: 'background 0.2s' }}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: n.read ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                          {n.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 4px', color: n.read ? 'var(--text-secondary)' : '#fff', fontSize: 14, lineHeight: 1.4, fontWeight: n.read ? 400 : 600 }}>{n.text}</p>
                          <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                            {minutesAgo === 0 ? 'abhi' : minutesAgo < 60 ? `${minutesAgo} min pehle` : `${Math.floor(minutesAgo/60)}h pehle`}
                          </span>
                        </div>
                        {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold-glow)', alignSelf: 'center', flexShrink: 0, boxShadow: '0 0 6px rgba(212,175,55,0.6)' }}></div>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  if (isCheckingProfile && step === 'auth') {
    return (
      <div className="mobile-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0D0F' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-red-dot" style={{ width: 40, height: 40, margin: '0 auto 16px', background: 'var(--gold-glow)' }}></div>
          <p style={{ color: 'var(--gold-glow)', fontWeight: 600 }}>Chhatrachhaya Taiyaar Ho Rahi Hai...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {step === 'auth' && <AuthScreen onNext={() => {
        // Immediate feedback after successful auth
        setIsCheckingProfile(true);
      }} />}
      {step === 'role' && <RoleScreen onSelect={r => { setRole(r); setStep('onboarding'); }} onCancel={handleLogout} />}
      {step === 'onboarding' && role && <OnboardingScreen userRole={role} initialName={userName} onComplete={handleOnboardingComplete} onCancel={handleLogout} />}
    </div>
  );
}

function Tab({ icon, label, id, current, set, isCenter }: any) {
  const isActive = current === id;
  return (
    <button 
      onClick={() => set(id)}
      style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', cursor: 'pointer', flex: 1, padding: '8px 0', gap: '4px'
      }}
    >
      <div style={{ 
        fontSize: isCenter ? '28px' : '24px', 
        filter: isActive ? 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.5))' : 'grayscale(100%) opacity(40%)', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isCenter && isActive ? 'scale(1.1)' : 'scale(1)'
      }}>
        {icon}
      </div>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: isActive ? 700 : 500, 
        color: isActive ? 'var(--gold-glow)' : 'var(--text-secondary)', 
        letterSpacing: '0.5px',
        transition: 'color 0.3s'
      }}>
        {label}
      </span>
      {/* Gold Dot */}
      <div style={{ 
        width: '4px', height: '4px', 
        background: 'var(--gold-glow)', 
        borderRadius: '50%', 
        opacity: isActive ? 1 : 0, 
        transform: isActive ? 'scale(1)' : 'scale(0)',
        transition: 'all 0.3s',
        boxShadow: '0 0 4px var(--gold-glow)'
      }} />
    </button>
  );
}
