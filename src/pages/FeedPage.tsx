import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const SAMPLE_POSTS = [
  { id: 'p1', author: 'Rajesh Kumar', role: 'ELDER' as const, city: 'Lucknow', designation: 'Retd. SBI Manager', content: 'Beta, UPSC ki taiyari ke liye sabse pehle NCERT padho. 10 saal ki government service mein maine dekha hai ki jo log basics strong karte hain, woh aage jaate hain. Consistency hi success hai. 🙏', tags: ['govt_jobs', 'upsc', 'career'], time: '2h', saves: 47, replies: 12 },
  { id: 'p2', author: 'Priya Sharma', role: 'STUDENT' as const, city: 'Varanasi', content: 'Koi mujhe bata sakta hai ki data science ke liye konsa course se start karein? BCA 2nd year mein hoon, coding thodi aati hai. Family ka pressure hai government job ka but mujhe tech mein interest hai. 😅', tags: ['tech', 'career_advice'], time: '5h', saves: 3, replies: 8 },
  { id: 'p3', author: 'Sunita Verma', role: 'ELDER' as const, city: 'Kanpur', designation: 'Retd. Teacher, 32 yrs', content: '32 saal padhane ke baad ek baat seekhi — students ko rules nahi, direction chahiye. Apni life mein ek mentor zaroor rakho. Jo seedha raasta dikhaye woh kisi bhi teacher se bada hota hai. 🌟', tags: ['education', 'career_advice'], time: '1d', saves: 89, replies: 23 },
  { id: 'p4', author: 'Amit Singh', role: 'STUDENT' as const, city: 'Agra', content: 'Finally! CAT mein 85 percentile aayi! Sab logo ne kaha tha small town se MBA nahi hoti. Aaj unhe jawab de diya. Chhatrachhaya ke mentor uncle ne jo guidance di, usne sab badal diya! 🎉', tags: ['success_story', 'mba'], time: '2d', saves: 234, replies: 45 },
  { id: 'p5', author: 'Dr. Mohan Lal', role: 'ELDER' as const, city: 'Allahabad', designation: 'Senior Scientist, ISRO (Retd.)', content: 'ISRO mein 28 saal kaam kiya. Aerospace engineering mein career banana mushkil lagta hai lekin impossible nahi. JEE ke baad NIT ya IIT se B.Tech karo, phir ISRO ka exam do. Dedication chahiye — seedha poochho mujhse! 🚀', tags: ['tech', 'isro', 'career'], time: '3d', saves: 156, replies: 31 },
];

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

export default function FeedPage() {
  const { user, addPost } = useApp() as any;
  const [localPosts, setLocalPosts] = useState(SAMPLE_POSTS);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('All');
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const FILTERS = ['All', 'Wisdom', 'Questions', 'Success', 'Tech', 'Govt'];

  const handlePost = () => {
    if (!text.trim() || !user) return;
    const newPost = {
      id: `p_${Date.now()}`,
      author: user.name,
      role: user.role,
      city: user.city,
      content: text.trim(),
      tags: [],
      time: 'just now',
      saves: 0,
      replies: 0,
    };
    setLocalPosts(prev => [newPost, ...prev]);
    setText('');
  };

  const handleSave = (id: string) => {
    setSaved(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
    setLocalPosts(prev => prev.map(p => p.id === id ? { ...p, saves: saved.has(id) ? p.saves - 1 : p.saves + 1 } : p));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-xl mx-auto p-4">
        {/* Composer */}
        {user && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
            <div className="flex gap-3">
              <Avatar name={user.name} role={user.role} />
              <div className="flex-1">
                <textarea
                  className="w-full text-sm text-gray-800 resize-none outline-none placeholder-gray-400 min-h-[60px]"
                  placeholder={user.role === 'ELDER' ? 'Koi wisdom share karo...' : 'Koi sawaal poochho...'}
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
                <div className="flex justify-end">
                  <button onClick={handlePost} disabled={!text.trim()}
                    className="px-4 py-2 rounded-xl font-bold text-white text-sm disabled:opacity-40 hover:opacity-90 transition-all"
                    style={{ background: user.role === 'ELDER' ? '#1D9E75' : '#534AB7' }}>
                    Post karo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border"
              style={{ background: f === filter ? '#1D9E75' : 'white', color: f === filter ? 'white' : '#1D9E75', borderColor: '#1D9E75' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {localPosts.map((post, i) => (
            <React.Fragment key={post.id}>
              {i > 0 && i % 5 === 0 && (
                <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #1D9E75, #534AB7)' }}>
                  <div className="text-xs font-bold uppercase tracking-wide opacity-80 mb-1">✨ Wisdom of the Day</div>
                  <div className="text-lg font-bold leading-snug">"Himmat karke ek kadam uthao, baaki raasta khud mil jaayega."</div>
                  <div className="text-xs opacity-70 mt-2">— Rajesh Kumar, BSNL</div>
                </div>
              )}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                style={{ borderLeft: `3px solid ${post.role === 'ELDER' ? '#E8A020' : '#534AB7'}` }}>
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar name={post.author} role={post.role} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-800 text-sm">{post.author}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: post.role === 'ELDER' ? '#FAEEDA' : '#EEEDFE', color: post.role === 'ELDER' ? '#E8A020' : '#534AB7' }}>
                          {post.role === 'ELDER' ? 'Elder ✓' : 'Student'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {(post as any).designation && <span>{(post as any).designation} • </span>}
                        {post.city} · {post.time}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{post.content}</p>
                  {post.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {post.tags.map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-md" style={{ background: '#F7F7F5', color: '#888' }}>#{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
                    <button onClick={() => handleSave(post.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-yellow-500 transition-colors">
                      <span>{saved.has(post.id) ? '💛' : '🤍'}</span>
                      <span>Shukriya {post.saves > 0 ? post.saves : ''}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 transition-colors">
                      <span>💬</span><span>Reply {post.replies > 0 ? post.replies : ''}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-500 transition-colors ml-auto">
                      <span>↗</span><span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
