import React, { useState, useEffect } from 'react';
import { seedDatabase } from './seedFirebase';
import { db, auth } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProfileScreen({ userName, userRole, onLogout }: { userName?: string, userRole?: string | null, onLogout?: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (snap.exists()) {
          setProfile(snap.data());
        }
      }
    };
    fetchProfile();
  }, []);

  return (
    <div style={{ paddingBottom: '80px', minHeight: '100vh' }}>
      
      {/* Dark Gradient Header */}
      <div style={{ 
        position: 'relative', 
        height: '220px', 
        background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.15) 0%, var(--bg-color) 100%)',
        borderBottom: '1px solid var(--glass-border)'
      }}>
        <div style={{ position: 'absolute', bottom: '-40px', left: '24px', display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
          
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05))',
            border: '2px solid var(--gold-glow)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: 'var(--gold-glow)', fontSize: '32px', fontWeight: 800,
            boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3)',
            position: 'relative'
          }}>
            {initials}
            {/* Gold Verified Badge */}
            <div style={{ 
              position: 'absolute', bottom: '0', right: '-4px', 
              background: 'var(--bg-color)', borderRadius: '50%', padding: '2px'
            }}>
              <div style={{ background: 'var(--gold-glow)', color: '#000', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                ✓
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '56px 24px 24px' }}>
        
        {/* User Info */}
        <div style={{ marginBottom: '24px' }}>
          <h2 className="serif-font" style={{ fontSize: '28px', color: '#fff', margin: '0 0 6px', letterSpacing: '0.5px' }}>{userName || 'User'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ color: userRole === 'ELDER' ? 'var(--gold-glow)' : 'var(--indigo-glow)', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {userRole === 'ELDER' ? 'Verified Margdarshak' : 'Shishya'}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>·</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{profile?.city || 'India'}</span>
          </div>
          <p style={{ color: 'var(--text-primary)', fontSize: '15px', margin: 0, fontWeight: 400 }}>
            {profile?.bio || (userRole === 'ELDER' ? 'Experienced Professional · Sharing Wisdom' : 'Student · Exploring Career Paths')}
          </p>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Baatcheet', value: profile?.stats?.sessions || '0' },
            { label: userRole === 'ELDER' ? 'Shishya Helped' : 'Gyaan Taken', value: profile?.stats?.helped || '0' },
            { label: 'Gyaan Score', value: profile?.stats?.score || '100' }
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, background: '#161618', border: '1px solid var(--glass-border-light)', borderRadius: '16px', padding: '16px 12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gold-glow)', marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Expertise Chips */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '15px', color: '#fff', margin: '0 0 12px', letterSpacing: '0.5px' }}>{userRole === 'ELDER' ? 'Expertise' : 'Interests'}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {(profile?.interests || ['Learning', 'Growth']).map(chip => (
              <span key={chip} style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.3)', color: 'var(--gold-glow)', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Availability */}
        {profile?.availabilityDays && (
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', borderLeft: '4px solid var(--indigo-glow)', borderRadius: '12px', padding: '16px', marginBottom: '32px' }}>
            <div style={{ color: 'var(--indigo-glow)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Availability</div>
            <div style={{ color: '#fff', fontSize: '15px' }}>
              {profile.availabilityDays.join(', ')} · {profile.availabilityTime?.join(', ')}
            </div>
          </div>
        )}

        {/* Settings List */}
        <div>
          <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '0 0 12px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Settings</h3>
          <div style={{ background: '#161618', border: '1px solid var(--glass-border-light)', borderRadius: '16px', overflow: 'hidden' }}>
            {[
              { label: 'Suchnaayein (Notifications)', icon: '🔔' },
              { label: 'Bhasha (Language)', icon: '🌐' },
              { label: 'Privacy', icon: '🔒' },
              { label: 'Sahayata (Help)', icon: '💬' }
            ].map((item, i) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderBottom: i !== 3 ? '1px solid var(--glass-border)' : 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span style={{ color: '#fff', fontSize: '15px', fontWeight: 500 }}>{item.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>›</span>
              </div>
            ))}
          </div>
          
          <button onClick={onLogout} style={{ 
            width: '100%', marginTop: '16px', padding: '16px', 
            background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', 
            border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', 
            fontSize: '15px', fontWeight: 700,
            cursor: 'pointer'
          }}>
            Bahar Jaayein (Sign Out)
          </button>

          <button id="seed-btn" style={{ 
            width: '100%', marginTop: '16px', padding: '16px', 
            background: 'var(--card-bg-secondary)', color: 'var(--gold-glow)', 
            border: '1px dashed var(--gold-glow)', borderRadius: '16px', 
            fontSize: '15px', fontWeight: 700,
            cursor: 'pointer'
          }} onClick={async () => {
            const btn = document.getElementById('seed-btn');
            if (btn) btn.innerText = 'Seeding Firebase...';
            await seedDatabase();
            if (btn) btn.innerText = 'Database Seeded! ✓';
          }}>
            Push Mock Data to Firebase (Dev)
          </button>
        </div>

      </div>
    </div>
  );
}
