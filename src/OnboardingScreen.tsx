import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { auth, storage, db } from './firebase';
import { QUIZ_DATA } from './quizData';
import { UserRole } from './App';

const CITIES = ["Lucknow", "Varanasi", "Gorakhpur", "Allahabad", "Kanpur", "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Patna", "Bhopal", "Others"];
const EDUCATION_LEVELS = ["10th", "11th-12th", "Graduation", "Post Graduation", "Dropout", "Other"];
const INTEREST_CHIPS = ["UPSC", "Banking", "Technology", "Business", "Agriculture", "Others"];

export default function OnboardingScreen({ userRole, initialName, onComplete, onCancel }: { userRole: UserRole, initialName: string, onComplete: (data: any) => void, onCancel: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isElder = userRole === 'ELDER';
  const totalSteps = 6;
  const [step, setStep] = useState(1);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timer, setTimer] = useState(30);
  const [shapathAgreed, setShapathAgreed] = useState(false);
  
  const [data, setData] = useState({
    photoUrl: '',
    fullName: initialName || '',
    city: '',
    organization: '',
    designation: '',
    yearsOfService: '',
    bio: '',
    educationLevel: '',
    institution: '',
    careerGoal: '',
    interests: [] as string[]
  });

  const updateData = (fields: Partial<typeof data>) => setData(prev => ({ ...prev, ...fields }));

  const nextStep = () => {
    if (step === 3) {
      // Initialize Quiz before moving to step 4
      prepareQuiz();
    }
    if (step < totalSteps) setStep(step + 1);
    else onComplete(data);
  };
  
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Quiz Timer logic
  useEffect(() => {
    let interval: any;
    if (step === 4 && !quizFinished && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timer === 0 && !quizFinished) {
      setQuizFinished(true);
    }
    return () => clearInterval(interval);
  }, [step, timer, quizFinished]);

  const prepareQuiz = () => {
    const selected = data.interests.length > 0 ? data.interests : ["General"];
    let pooledQuestions: any[] = [];
    selected.forEach(interest => {
      if (QUIZ_DATA[interest]) {
        pooledQuestions = [...pooledQuestions, ...QUIZ_DATA[interest]];
      }
    });
    if (pooledQuestions.length === 0) pooledQuestions = QUIZ_DATA["General"];
    
    // Shuffle and pick 3
    const shuffled = [...pooledQuestions].sort(() => 0.5 - Math.random()).slice(0, 3);
    setQuizQuestions(shuffled);
    setCurrentQuizIdx(0);
    setQuizScore(0);
    setQuizFinished(false);
    setTimer(30);
  };

  const handleQuizAnswer = (option: string) => {
    if (option === quizQuestions[currentQuizIdx].a) {
      setQuizScore(s => s + 1);
    }
    
    if (currentQuizIdx < quizQuestions.length - 1) {
      setCurrentQuizIdx(currentQuizIdx + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const renderProgressBar = () => (
    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', marginBottom: '16px', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ width: `${(step / totalSteps) * 100}%`, height: '100%', background: 'var(--gold-gradient)', transition: 'width 0.3s ease' }}></div>
    </div>
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const user = auth.currentUser;
    if (file && user) {
      setUploadingPhoto(true);
      try {
        const storageRef = ref(storage, `profilePhotos/${user.uid}`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        // Update local state
        updateData({ photoUrl: downloadUrl });
        // Persist to Firestore for future sessions
        await setDoc(doc(db, 'users', user.uid), { photoUrl: downloadUrl }, { merge: true });
      } catch (err) {
        console.error("Upload failed", err);
        alert(`Photo upload failed: ${(err as any).message || err}`);
      } finally {
        setUploadingPhoto(false);
      }
    } else {
      console.warn("No file selected or user not authenticated");
      alert("Please sign in before uploading a photo.");
    }
  };

  const renderStep1 = () => (
    <div className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 className="serif-font" style={{ color: '#fff', fontSize: 24, margin: '0 0 8px' }}>Photo Aur Naam</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>Aapki pehchaan, aapki shuruaat</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            width: '120px', height: '120px', borderRadius: '50%', border: '2px dashed var(--gold-glow)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative',
            background: data.photoUrl ? '#000' : 'rgba(212, 175, 55, 0.05)'
          }}
        >
          {uploadingPhoto ? <div className="pulse-red-dot" style={{ width: 24, height: 24, background: 'var(--gold-glow)' }}></div> : 
           data.photoUrl ? <img src={data.photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 
           <div style={{ color: 'var(--gold-glow)', fontSize: '32px' }}>📷</div>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input className="onboarding-input" placeholder="Aapka Naam" value={data.fullName} onChange={e => updateData({ fullName: e.target.value })} />
        <select className="onboarding-input" value={data.city} onChange={e => updateData({ city: e.target.value })}>
          <option value="" disabled>Shehar (City) Chuniye</option>
          {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
        </select>
      </div>
      <button onClick={nextStep} disabled={!data.fullName || !data.city} className="onboarding-btn" style={{ marginTop: '32px', opacity: (!data.fullName || !data.city) ? 0.5 : 1 }}>Aage Badhein</button>
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 className="serif-font" style={{ color: '#fff', fontSize: 24, margin: '0 0 8px' }}>Aapke Baare Mein</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>Apna tajurba batayein</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isElder ? (
          <>
            <input className="onboarding-input" placeholder="Organization" value={data.organization} onChange={e => updateData({ organization: e.target.value })} />
            <input className="onboarding-input" placeholder="Designation" value={data.designation} onChange={e => updateData({ designation: e.target.value })} />
            <input type="number" className="onboarding-input" placeholder="Years of Service" value={data.yearsOfService} onChange={e => updateData({ yearsOfService: e.target.value })} />
          </>
        ) : (
          <>
            <select className="onboarding-input" value={data.educationLevel} onChange={e => updateData({ educationLevel: e.target.value })}>
              <option value="" disabled>Education Level</option>
              {EDUCATION_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
            </select>
            <input className="onboarding-input" placeholder="Institution" value={data.institution} onChange={e => updateData({ institution: e.target.value })} />
            <input className="onboarding-input" placeholder="Career Goal" value={data.careerGoal} onChange={e => updateData({ careerGoal: e.target.value })} />
          </>
        )}
        <textarea className="onboarding-input" placeholder="Bio (Max 200 chars)" value={data.bio} onChange={e => updateData({ bio: e.target.value.slice(0, 200) })} style={{ minHeight: '100px' }} />
      </div>
      <button onClick={nextStep} disabled={isElder ? !data.organization : !data.educationLevel} className="onboarding-btn" style={{ marginTop: '32px' }}>Aage Badhein</button>
    </div>
  );

  const renderStep3 = () => (
    <div className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 className="serif-font" style={{ color: '#fff', fontSize: 24, margin: '0 0 8px' }}>Ruchiyan</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>Aapko kismein interest hai? (Min 1)</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
        {INTEREST_CHIPS.map(interest => (
          <button key={interest} onClick={() => updateData({ interests: data.interests.includes(interest) ? data.interests.filter(i => i !== interest) : [...data.interests, interest] })}
            style={{ padding: '10px 16px', borderRadius: '20px', border: data.interests.includes(interest) ? '1px solid var(--gold-glow)' : '1px solid rgba(255,255,255,0.1)', background: data.interests.includes(interest) ? 'var(--gold-gradient)' : 'rgba(255,255,255,0.05)', color: data.interests.includes(interest) ? '#000' : '#fff', cursor: 'pointer' }}>
            {interest}
          </button>
        ))}
      </div>
      <button onClick={nextStep} disabled={data.interests.length < 1} className="onboarding-btn" style={{ marginTop: '32px', opacity: data.interests.length < 1 ? 0.5 : 1 }}>Quiz Shuru Karein</button>
    </div>
  );

  const renderStep4Quiz = () => {
    if (quizQuestions.length === 0) return <div>Loading Quiz...</div>;
    const currentQ = quizQuestions[currentQuizIdx];

    return (
      <div className="animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⏱️</div>
          <h2 className="serif-font" style={{ color: timer < 10 ? 'var(--live-red)' : '#fff', fontSize: 32, margin: '0 0 8px' }}>{timer}s</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>Legitimacy Check: {currentQuizIdx + 1}/{quizQuestions.length}</p>
        </div>

        {!quizFinished ? (
          <div className="glass-panel" style={{ padding: 24 }}>
            <p style={{ color: '#fff', fontSize: 18, marginBottom: 20, lineHeight: 1.5, fontWeight: 600 }}>{currentQ.q}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {currentQ.options.map((opt: string) => (
                <button key={opt} onClick={() => handleQuizAnswer(opt)} className="onboarding-input" style={{ textAlign: 'left', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{quizScore >= 2 ? '✅' : '❌'}</div>
            <h2 className="serif-font" style={{ color: '#fff', marginBottom: 8 }}>{quizScore >= 2 ? 'Pariksha Safal!' : 'Pariksha Asafal'}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Aapne {quizScore} sahi jawab diye.</p>
            {quizScore >= 2 ? (
              <button onClick={nextStep} className="onboarding-btn">Maryada Shapath Karein</button>
            ) : (
              <button onClick={() => { prepareQuiz(); setStep(4); }} className="onboarding-btn" style={{ background: 'var(--bg-color)', color: '#fff', border: '1px solid var(--glass-border)' }}>Dobara Try Karein</button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderStep5Shapath = () => (
    <div className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 className="serif-font" style={{ color: 'var(--gold-glow)', fontSize: 28, margin: '0 0 8px' }}>Maryada Aur Shapath</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>Chhatrachhaya ke niyam ka palan karein</p>
      </div>

      <div className="glass-panel" style={{ padding: 24, marginBottom: 32 }}>
        <ul style={{ color: 'var(--text-primary)', padding: 0, listStyle: 'none', textAlign: 'left' }}>
          <li style={{ marginBottom: 16, display: 'flex', gap: 12 }}><span style={{ color: 'var(--gold-glow)' }}>⚖️</span> <span>Main hamesha sabka samman (respect) karunga/karungi.</span></li>
          <li style={{ marginBottom: 16, display: 'flex', gap: 12 }}><span style={{ color: 'var(--gold-glow)' }}>🤝</span> <span>Main bina kisi swarth ke doosron ki madad karunga/karungi.</span></li>
          <li style={{ marginBottom: 16, display: 'flex', gap: 12 }}><span style={{ color: 'var(--gold-glow)' }}>🚫</span> <span>Main app par koi bhi spam ya galat content nahi failaunga/failaungi.</span></li>
          <li style={{ display: 'flex', gap: 12 }}><span style={{ color: 'var(--gold-glow)' }}>📜</span> <span>Main ek "Legit" user hoon aur sirf seekhne ya sikhane aaya hoon.</span></li>
        </ul>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, cursor: 'pointer' }} onClick={() => setShapathAgreed(!shapathAgreed)}>
        <div style={{ width: 24, height: 24, borderRadius: 6, border: '2px solid var(--gold-glow)', background: shapathAgreed ? 'var(--gold-glow)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 14 }}>{shapathAgreed && '✓'}</div>
        <p style={{ color: '#fff', margin: 0, fontSize: 15, fontWeight: 600 }}>Main in niyamon ka palan karne ki Shapath leta hoon.</p>
      </div>

      <button onClick={nextStep} disabled={!shapathAgreed} className="onboarding-btn" style={{ opacity: shapathAgreed ? 1 : 0.5 }}>Aage Badhein</button>
    </div>
  );

  const renderStep6Review = () => (
    <div className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 className="serif-font" style={{ color: '#fff', fontSize: 24, margin: '0 0 8px' }}>Profile Ready</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14 }}>Sab kuch sahi hai?</p>
      </div>
      <div className="premium-card" style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#333', margin: '0 auto 16px', overflow: 'hidden' }}>
          {data.photoUrl ? <img src={data.photoUrl} alt="P" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 32, paddingTop: 20 }}>👤</div>}
        </div>
        <h3 className="serif-font" style={{ color: '#fff', margin: 0 }}>{data.fullName}</h3>
        <p style={{ color: 'var(--gold-glow)', fontSize: 14, margin: '4px 0 12px' }}>{isElder ? data.designation : data.educationLevel} • {data.city}</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontStyle: 'italic' }}>"{data.bio}"</p>
      </div>
      <button onClick={() => onComplete(data)} className="onboarding-btn" style={{ marginTop: '32px' }}>Chhatrachhaya Mein Pravesh Karein</button>
    </div>
  );

  return (
    <div style={{ padding: '24px', paddingTop: '80px', maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#0D0D0F', position: 'relative' }}>
      <button onClick={() => step === 1 ? onCancel() : prevStep()} style={{ position: 'absolute', top: 24, left: 24, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>← Pichla Step</button>
      <div style={{ position: 'absolute', top: 24, right: 24, color: 'var(--gold-glow)', fontSize: 14, fontWeight: 700 }}>{step}/{totalSteps}</div>
      <style>{`
        .onboarding-input { padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 15px; outline: none; width: 100%; box-sizing: border-box; transition: all 0.3s ease; }
        .onboarding-input option { background: #1A1A1D; color: #fff; }
        .onboarding-btn { width: 100%; padding: 16px; background: var(--gold-gradient); color: #000; border: none; border-radius: 12px; font-size: 16px; font-weight: 800; cursor: pointer; box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3); transition: all 0.3s ease; }
      `}</style>
      {renderProgressBar()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4Quiz()}
      {step === 5 && renderStep5Shapath()}
      {step === 6 && renderStep6Review()}
    </div>
  );
}
