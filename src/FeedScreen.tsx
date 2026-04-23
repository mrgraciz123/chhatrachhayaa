import React, { useState, useEffect } from 'react';
import { UserRole } from './App';
import { db, auth } from './firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, getDocs } from 'firebase/firestore';
import { sendNotification } from './notifications';

export default function FeedScreen({ userRole, userName, userProfile }: { userRole: UserRole, userName: string, userProfile: any }) {
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isInserting, setIsInserting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [posts, setPosts] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState('');
  
  // Comments Bottom Sheet State
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  
  const FILTERS = ['All', 'Wisdom', 'Questions', 'Tech', 'Govt Jobs'];

  useEffect(() => {
    let initialLoad = true;
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(15));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts: any[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !initialLoad) {
          const postData = change.doc.data();
          if (postData.uid !== auth.currentUser?.uid) {
            showToast(`${postData.name} ne post kiya!`);
          }
        }
      });
      
      snapshot.forEach((doc) => {
        fetchedPosts.push({ id: doc.id, ...doc.data() });
      });
      
      setPosts(fetchedPosts);
      setLoading(false);
      initialLoad = false;
    });

    return () => unsubscribe();
  }, []);

  // Listen to comments when bottom sheet is open
  useEffect(() => {
    if (!activePostId) return;
    
    const q = query(collection(db, `posts/${activePostId}/comments`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments: any[] = [];
      snapshot.forEach((doc) => {
        fetchedComments.push({ id: doc.id, ...doc.data() });
      });
      setComments(fetchedComments);
    });
    
    return () => unsubscribe();
  }, [activePostId]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleShare = async () => {
    if (!newPostContent.trim() || !auth.currentUser) return;
    setIsInserting(true);
    
    try {
      await addDoc(collection(db, 'posts'), {
        uid: auth.currentUser.uid,
        name: userProfile?.fullName || userProfile?.displayName || userName,
        role: userRole,
        city: userProfile?.city || 'India',
        photoURL: userProfile?.photoUrl || '',
        content: newPostContent.trim(),
        interests: userProfile?.interests || [],
        likes: [],
        commentsCount: 0,
        createdAt: serverTimestamp()
      });
      setNewPostContent('');
    } catch (err) {
      console.error("Error adding post:", err);
      alert("Failed to share post");
    } finally {
      setIsInserting(false);
    }
  };

  const handleLike = async (postId: string, currentLikes: string[], postOwnerUid: string, postOwnerName: string) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const postRef = doc(db, 'posts', postId);
    
    if (currentLikes.includes(uid)) {
      await updateDoc(postRef, { likes: arrayRemove(uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(uid) });
      // Notify the post owner (not yourself)
      if (postOwnerUid && postOwnerUid !== uid) {
        sendNotification({
          recipientUid: postOwnerUid,
          type: 'like',
          text: `${userProfile?.fullName || userName} ne aapki post pasand ki`,
          fromName: userProfile?.fullName || userName,
          navigateTo: 'feed'
        });
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !auth.currentUser || !activePostId) return;
    setIsAddingComment(true);
    try {
      await addDoc(collection(db, `posts/${activePostId}/comments`), {
        uid: auth.currentUser.uid,
        name: userProfile?.fullName || userProfile?.displayName || userName,
        role: userRole,
        photoURL: userProfile?.photoUrl || '',
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      
      // Update comment count on post
      const postRef = doc(db, 'posts', activePostId);
      const post = posts.find(p => p.id === activePostId);
      await updateDoc(postRef, { commentsCount: (post?.commentsCount || 0) + 1 });
      
      setNewComment('');
    } catch (err) {
      console.error("Error adding comment", err);
    } finally {
      setIsAddingComment(false);
    }
  };

  return (
    <>
      {toastMsg && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: 'var(--gold-glow)', color: '#000', padding: '10px 20px', borderRadius: 24, fontWeight: 700, zIndex: 1000, animation: 'slideDown 0.3s ease-out, fadeOut 0.3s 2.7s forwards', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)' }}>
          {toastMsg}
        </div>
      )}

      <div className="chip-scroll">
        {FILTERS.map(filter => (
          <div 
            key={filter}
            className={`chip ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
            style={{ cursor: 'pointer' }}
          >
            {filter}
          </div>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {/* Aaj Ki Wisdom Card */}
        <div className="premium-card floating" style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05))', border: '1px solid var(--gold-glow)', padding: 16, marginBottom: 24, boxShadow: '0 8px 32px rgba(212, 175, 55, 0.15)' }}>
          <div style={{ color: 'var(--gold-glow)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>☀️</span> AAJ KI WISDOM
          </div>
          <p className="serif-font" style={{ margin: '0 0 12px', fontSize: 18, fontStyle: 'italic', color: '#fff', lineHeight: 1.5, fontWeight: 400 }}>
            "Himmat karke ek kadam uthao, baaki raasta khud mil jaayega."
          </p>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>— Rajesh Kumar, Former SBI Director</div>
        </div>

        {/* Post Composer */}
        <div className="glass-panel" style={{ padding: 20, marginBottom: 24 }}>
          <textarea
            className="text-area-composer"
            placeholder={userRole === 'ELDER' ? "Share your wisdom..." : "Ask a question..."}
            value={newPostContent}
            onChange={e => setNewPostContent(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button 
              onClick={handleShare}
              disabled={!newPostContent.trim() || isInserting}
              style={{ background: userRole === 'ELDER' ? 'var(--gold-glow)' : 'var(--indigo-glow)', color: '#000', border: 'none', padding: '6px 16px', borderRadius: 20, fontWeight: 700, opacity: newPostContent.trim() ? 1 : 0.5, cursor: 'pointer' }}
            >
              Share
            </button>
          </div>
        </div>

        {/* Live Posts */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
             <div className="pulse-red-dot" style={{ width: 24, height: 24, background: 'var(--gold-glow)' }}></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {posts.filter(post => {
              if (activeFilter === 'All') return true;
              if (activeFilter === 'Wisdom') return post.role === 'ELDER';
              if (activeFilter === 'Questions') return post.role === 'STUDENT';
              if (activeFilter === 'Tech') return post.interests?.includes('Technology');
              if (activeFilter === 'Govt Jobs') return post.interests?.includes('UPSC') || post.interests?.includes('Banking');
              return true;
            }).map((post, index) => {
              const isElder = post.role === 'ELDER';
              const displayTime = post.createdAt?.toDate ? post.createdAt.toDate() : new Date();
              const timeString = displayTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              const currentUserId = auth.currentUser?.uid;
              const hasLiked = currentUserId && post.likes?.includes(currentUserId);
              
              return (
                <div key={post.id} className={`premium-card animate-fade-in ${isElder ? 'elder' : 'student'}`} style={{ animationDelay: `${Math.min(index * 0.1, 0.5)}s`, overflow: 'hidden' }}>
                  <div style={{ padding: '20px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div className={`avatar ${isElder ? 'elder' : 'student'}`} style={{ backgroundImage: post.photoURL ? `url(${post.photoURL})` : 'none', backgroundSize: 'cover' }}>
                          {!post.photoURL && (post.name?.[0]?.toUpperCase() || 'U')}
                        </div>
                        <div>
                          <h3 className="serif-font" style={{ margin: '0 0 6px', fontSize: 19, color: '#fff', letterSpacing: '0.5px' }}>
                            {post.name} {isElder && <span style={{ color: 'var(--gold-glow)', fontSize: 14 }}>✓</span>}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                            <span style={{ color: isElder ? 'var(--gold-glow)' : 'var(--indigo-glow)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: 10 }}>{isElder ? 'Margdarshak' : 'Shishya'}</span>
                            <span>•</span>
                            <span>{post.city || 'India'}</span>
                            <span>•</span>
                            <span>{timeString}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--text-primary)', margin: '0 0 16px', fontWeight: 400, letterSpacing: '0.3px', whiteSpace: 'pre-wrap' }}>
                      {post.content}
                    </p>

                    {/* Hashtag Chips */}
                    {post.interests && post.interests.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                        {post.interests.map((tag: string) => (
                          <span key={tag} style={{ background: isElder ? 'rgba(212, 175, 55, 0.1)' : 'rgba(99, 102, 241, 0.1)', color: isElder ? 'var(--gold-glow)' : 'var(--indigo-glow)', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                            #{tag.replace(/\s+/g, '')}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
                      <button 
                        onClick={() => handleLike(post.id, post.likes || [], post.uid, post.name)}
                        className="action-btn" style={{ color: hasLiked ? 'var(--live-red)' : 'var(--text-secondary)' }}
                      >
                        <span style={{ fontSize: 20 }}>{hasLiked ? '❤️' : '🤍'}</span> 
                        {post.likes?.length || 0}
                      </button>
                      <button 
                        onClick={() => setActivePostId(post.id)}
                        className="action-btn"
                      >
                        <span style={{ fontSize: 20 }}>💬</span> {post.commentsCount || 0}
                      </button>
                      <button className="action-btn" style={{ marginLeft: 'auto' }}>
                        <span style={{ fontSize: 20 }}>📤</span> Share
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comments Bottom Sheet */}
      {activePostId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={() => setActivePostId(null)}>
          <div style={{ background: '#1A1A1D', width: '100%', maxWidth: '480px', margin: '0 auto', height: '80%', borderTopLeftRadius: 24, borderTopRightRadius: 24, display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
            
            <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="serif-font" style={{ color: '#fff', fontSize: 20, margin: 0 }}>Comments</h2>
              <button onClick={() => setActivePostId(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 40 }}>Be the first to comment!</div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} style={{ display: 'flex', gap: 12 }}>
                     <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {comment.photoURL ? <img src={comment.photoURL} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{color:'#fff', fontSize:14}}>{comment.name?.charAt(0) || '?'}</span>}
                     </div>
                     <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 16, borderTopLeftRadius: 4 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                         <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{comment.name}</span>
                         <span style={{ color: comment.role === 'ELDER' ? '#E8A020' : '#7C6EDA', fontSize: 10, fontWeight: 700 }}>{comment.role === 'ELDER' ? 'Margdarshak' : 'Shishya'}</span>
                       </div>
                       <div style={{ color: '#E2E8F0', fontSize: 14, lineHeight: 1.4 }}>{comment.text}</div>
                     </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: 16, background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Aapki raay kya hai?" 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                style={{ flex: 1, padding: '12px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', outline: 'none', fontSize: 14 }}
              />
              <button 
                onClick={handleAddComment}
                disabled={!newComment.trim() || isAddingComment}
                style={{ background: 'var(--gold-gradient)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 20, fontWeight: 700, cursor: 'pointer', opacity: (!newComment.trim() || isAddingComment) ? 0.5 : 1 }}
              >
                Post
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
