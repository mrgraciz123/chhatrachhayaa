import React, { useState } from 'react';

export default function AIChatbotScreen() {
  const [messages, setMessages] = useState([
    { text: "Pranam! I am Chhatrachhaya AI, your personal guide. How can I assist you on your journey today?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, sender: 'user' }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { text: "That is a profound question. The Margdarshaks often say that patience is the key to clarity.", sender: 'ai' }]);
    }, 1000);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(20px)' }}>
        <h1 className="serif-font" style={{ fontSize: 24, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28, animation: 'pulseGlow 2s infinite' }}>🤖</span> Margdarshak AI
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Powered by Chhatrachhaya Intelligence</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 120 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.sender === 'ai' ? 'flex-start' : 'flex-end', maxWidth: '80%' }}>
            <div style={{
              background: m.sender === 'ai' ? 'rgba(255,255,255,0.05)' : 'var(--gold-dim)',
              border: `1px solid ${m.sender === 'ai' ? 'var(--glass-border)' : 'var(--gold-glow)'}`,
              padding: 16, borderRadius: 20, borderBottomLeftRadius: m.sender === 'ai' ? 4 : 20, borderBottomRightRadius: m.sender === 'user' ? 4 : 20,
              color: '#fff', fontSize: 15, lineHeight: 1.5
            }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: 'fixed', bottom: 90, left: 0, right: 0, padding: '0 24px', maxWidth: 680, margin: '0 auto' }}>
        <div className="glass-panel" style={{ display: 'flex', padding: 8, borderRadius: 24 }}>
          <input
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', padding: '0 16px', fontSize: 15 }}
            placeholder="Ask for guidance..." value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} style={{ background: 'var(--gold-glow)', border: 'none', width: 40, height: 40, borderRadius: '50%', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
