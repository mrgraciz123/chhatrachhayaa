import React, { useState, useRef, useEffect } from 'react';

export default function AiChatbot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: 'Namaste! 🙏 Main aapka AI Margdarshak hoon. Aap padhai, career, ya zindagi ke kisi bhi faisle par mujhse salaah le sakte hain. Aaj main aapki kya madad karoon?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const openAiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!openAiKey && !geminiKey) {
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Kripaya `.env` file mein apni `VITE_GEMINI_API_KEY` ya `VITE_OPENAI_API_KEY` daalein taaki main aapse baat kar sakoon!' }]);
          setIsLoading(false);
        }, 1000);
        return;
      }

      // If Gemini Key is present, prioritize it (especially since OpenAI might be out of quota)
      if (geminiKey) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `You are Chhatrachhaya AI, a wise Indian mentor (Margdarshak). Speak in Hinglish. Be encouraging and concise. User asked: ${userMessage}` }]
            }]
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Gemini API Error');
        
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf karna, main samajh nahi paaya.";
        setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
      } 
      // Otherwise fallback to OpenAI if the key exists
      else if (openAiKey) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: 'You are Chhatrachhaya AI, a wise Indian mentor (Margdarshak). Speak in Hinglish.' },
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: userMessage }
            ],
            max_tokens: 250
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'OpenAI API Error');
        setMessages(prev => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
      }
    } catch (e: any) {
      console.error("AI Chatbot Error:", e);
      setMessages(prev => [...prev, { role: 'assistant', content: `Maaf karna, abhi dikkat aa rahi hai: ${e.message}.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', backdropFilter: 'blur(8px)' }}>
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '480px', height: '85vh', background: 'var(--bg-color)', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', display: 'flex', flexDirection: 'column', border: '1px solid var(--glass-border-light)', borderBottom: 'none', overflow: 'hidden', boxShadow: '0 -20px 60px rgba(0,0,0,0.6)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(180deg, rgba(212,175,55,0.15) 0%, transparent 100%)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 0 16px rgba(212,175,55,0.4)' }}>
              🤖
            </div>
            <div>
              <h2 className="serif-font" style={{ margin: 0, color: '#fff', fontSize: '18px' }}>AI Margdarshak</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--live-red)', fontWeight: 600 }}>
                <span className="pulse-red-dot" style={{ width: '6px', height: '6px' }}></span> Hamesha Aapke Saath
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ 
                maxWidth: '85%', padding: '14px 18px', borderRadius: '20px', fontSize: '15px', lineHeight: 1.5,
                background: msg.role === 'user' ? 'var(--indigo-gradient)' : 'var(--card-bg)',
                color: '#fff',
                border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '20px',
                borderBottomLeftRadius: msg.role === 'user' ? '20px' : '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div style={{ padding: '14px 18px', background: 'var(--card-bg)', borderRadius: '20px', borderBottomLeftRadius: '4px', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                Soch rahe hain...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', background: 'var(--card-bg-secondary)' }}>
          <div style={{ display: 'flex', gap: '12px', background: '#000', borderRadius: '24px', padding: '6px 6px 6px 20px', border: '1px solid var(--glass-border)' }}>
            <input 
              type="text" 
              placeholder="Apna sawaal poochhein..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '15px', outline: 'none' }}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gold-gradient)', color: '#000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', cursor: 'pointer', opacity: input.trim() ? 1 : 0.5 }}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
