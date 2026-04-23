import React, { useState } from 'react';
import { useApp, AppUser, UserRole } from '../context/AppContext';

const CITIES = ['Delhi', 'Mumbai', 'Lucknow', 'Allahabad', 'Varanasi', 'Kanpur', 'Agra', 'Pune', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'];

export default function AuthPage() {
  const { setUser } = useApp();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const handleStart = () => {
    if (!name.trim() || !city || !role) return;
    const user: AppUser = {
      id: `u_${Date.now()}`,
      name: name.trim(),
      role,
      city,
      avatar: name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    };
    setUser(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #E1F5EE 0%, #EEEDFE 100%)' }}>
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 shadow-lg" style={{ background: '#1D9E75' }}>
            <span className="text-3xl">🤝</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#1D9E75' }}>Chhatrachhaya</h1>
          <p className="text-gray-500 mt-1 text-sm">AI shows you the path. Indian elders show you how to walk it.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {step === 'role' ? (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Aap kaun hain?</h2>
              <p className="text-gray-500 text-sm mb-6">Choose your role to get started</p>
              <div className="space-y-4">
                <button
                  onClick={() => { setRole('ELDER'); setStep('details'); }}
                  className="w-full p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md"
                  style={{ borderColor: '#1D9E75', background: '#E1F5EE' }}
                >
                  <div className="text-3xl mb-2">👴</div>
                  <div className="font-bold text-gray-800">Main ek anubhavi hoon</div>
                  <div className="text-sm text-gray-500">Retired professional • Share your wisdom</div>
                </button>
                <button
                  onClick={() => { setRole('STUDENT'); setStep('details'); }}
                  className="w-full p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md"
                  style={{ borderColor: '#534AB7', background: '#EEEDFE' }}
                >
                  <div className="text-3xl mb-2">🧑‍💻</div>
                  <div className="font-bold text-gray-800">Main ek student hoon</div>
                  <div className="text-sm text-gray-500">16–24 years • Find your career path</div>
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setStep('role')} className="flex items-center gap-2 text-gray-400 text-sm mb-6 hover:text-gray-600">
                ← Back
              </button>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {role === 'ELDER' ? '👴 Elder ka profile' : '🧑 Student ka profile'}
              </h2>
              <p className="text-gray-500 text-sm mb-6">No signup needed — just enter your name</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Aapka naam</label>
                  <input
                    className="w-full mt-1 border-2 border-gray-100 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-green-400 transition-colors"
                    placeholder={role === 'ELDER' ? 'e.g. Rajesh Kumar' : 'e.g. Priya Sharma'}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleStart()}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Aapka shehar</label>
                  <select
                    className="w-full mt-1 border-2 border-gray-100 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-green-400 transition-colors"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  >
                    <option value="">Select city...</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button
                  onClick={handleStart}
                  disabled={!name.trim() || !city}
                  className="w-full py-4 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: role === 'ELDER' ? '#1D9E75' : '#534AB7' }}
                >
                  Community Mein Aao! 🚀
                </button>
              </div>
            </>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">No account needed • Works instantly</p>
      </div>
    </div>
  );
}
