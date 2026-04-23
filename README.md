# 🪔 Chhatrachhaya
### *Buzurgon ki wisdom, naujawanon ka sapna*

> **Chhatrachhaya** (छत्रछाया) means *a shade that stays with you even in the harshest sun.*
> The wisdom of our elders is that shade. The ambition of our youth is that sun.
> Chhatrachhaya brings them together.

---

## 🌱 What is Chhatrachhaya?

Chhatrachhaya is a **Hindi-first, real-time intergenerational career mentorship platform** that connects Indian students (16–24) with retired professionals (60+).

India has **47 crore students** with no career guidance and **1.5 crore retired professionals** whose decades of wisdom sit completely idle. Chhatrachhaya is the bridge between the two — free, accessible, and built for Bharat — not just metros.

---

## 🎯 The Problem

```
❌ 65% of Indian students feel lost about career choices
❌ Tier 2 and Tier 3 cities have almost zero professional guidance
❌ Private mentorship costs ₹500–₹5000 per session
❌ 1.5 crore retired professionals have no platform to share wisdom
❌ The gap between experience and ambition is enormous
```

---

## ✅ The Solution

```
✅ Free mentorship — always, for everyone
✅ Hindi-first design — built for Gorakhpur, not just Gurgaon
✅ Real-time community — live feed, voice rooms, 1-on-1 sessions
✅ AI-powered matching — right student, right Margdarshak
✅ Both sides win — students get guidance, elders get purpose
```

---

## 👥 Two User Types

| | Margdarshak (Elder) | Shishya (Student) |
|---|---|---|
| Age | 60+ | 16–24 |
| Role | Retired Professional | Career Seeker |
| Goal | Share wisdom, find purpose | Get guidance, find clarity |
| Accent Color | Gold #E8A020 | Purple #7C6EDA |
| Badge | ✓ Verified Margdarshak | Shishya |

---

## 📱 Core Features

### 💬 Gyan Ki Baat (Community Feed)
- Real-time community feed — Instagram-style
- Elder posts with gold left border
- Student posts with purple left border
- Aaj Ki Wisdom highlight card daily
- Like (Gyaan Bachao), Comment, Share
- Post types: Wisdom, Question, Story, Win
- Hindi and Hinglish content throughout

### 🎙 Chaupal (Live Voice Rooms)
- Live voice sabhas hosted by Margdarshaks
- Topics: UPSC, Banking, Tech, Career, Finance
- Real-time member presence — see who is listening
- Raise hand to speak
- AI-generated session summary after room ends
- Schedule future sabhas

### 🤝 Mera Dost (AI Matching)
- AI matches Shishya with ideal Margdarshak
- Match score based on shared interests and city
- Hinglish match reason explanation
- One-tap connect — starts conversation instantly
- Browse multiple matches

### 📅 Baatcheet (1-on-1 Sessions)
- Book private sessions with matched Margdarshak
- Upcoming and past session management
- AI-generated prep notes before each session
- 5 questions to ask your Margdarshak
- Ice breaker suggestions in Hinglish
- Session summary after completion

### 💌 Real-Time Messaging
- Private conversations between matched users
- Real-time message delivery
- Voice message support
- Typing indicators
- Unread message count badges

### 👤 Parichay (Profile)
- Profile photo upload
- Role, city, designation, bio
- Interest chips (UPSC, Banking, Tech, etc.)
- Margdarshak availability slots
- Gyaan Score and session statistics
- Verified badge for authenticated elders

---

## 🛠 Tech Stack

```
Frontend        React.js
Styling         Tailwind CSS / Custom CSS
Hosting         Netlify
Authentication  Firebase Authentication
Database        Firebase Firestore (real-time)
Presence        Firebase Realtime Database
File Storage    Firebase Storage
Notifications   Firebase Cloud Messaging
Voice           WebRTC + simple-peer
```

---

## 🚀 Getting Started

### Prerequisites
```
Node.js v18 or above
npm or yarn
Firebase account (free tier works)
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/chhatrachhaya.git

# Navigate to project
cd chhatrachhaya

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Firebase Setup

```bash
# 1. Go to firebase.google.com
# 2. Create a new project named "Chhatrachhaya"
# 3. Enable these services:
#    - Authentication (Email/Password + Google)
#    - Firestore Database
#    - Realtime Database
#    - Storage
#    - Cloud Messaging

# 4. Get your config and add to .env.local:
```

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_DATABASE_URL=your_database_url
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Firebase Database Rules

```json
{
  "rules": {
    "presence": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "rooms": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.uid;
    }
    match /conversations/{conversationId} {
      allow read, write: if request.auth.uid in resource.data.participants;
    }
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Run Locally

```bash
# Start development server
npm start

# App runs on http://localhost:3000
```

### Deploy to Netlify

```bash
# Build the project
npm run build

# Deploy to Netlify
# Option 1: Drag and drop /build folder to netlify.com
# Option 2: Connect GitHub repo in Netlify dashboard
# Option 3: Netlify CLI
npm install -g netlify-cli
netlify deploy --prod
```

---

## 📁 Project Structure

```
chhatrachhaya/
│
├── public/
│   ├── index.html
│   └── favicon.ico
│
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── ProfileSetup.jsx
│   │   │
│   │   ├── feed/
│   │   │   ├── Feed.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── PostComposer.jsx
│   │   │   └── WisdomCard.jsx
│   │   │
│   │   ├── chaupal/
│   │   │   ├── RoomsList.jsx
│   │   │   ├── RoomCard.jsx
│   │   │   └── LiveRoom.jsx
│   │   │
│   │   ├── match/
│   │   │   ├── MatchScreen.jsx
│   │   │   └── MatchCard.jsx
│   │   │
│   │   ├── sessions/
│   │   │   ├── SessionsList.jsx
│   │   │   ├── SessionCard.jsx
│   │   │   └── PrepNotes.jsx
│   │   │
│   │   ├── messaging/
│   │   │   ├── ConversationsList.jsx
│   │   │   └── ChatScreen.jsx
│   │   │
│   │   ├── profile/
│   │   │   └── Profile.jsx
│   │   │
│   │   └── shared/
│   │       ├── TopBar.jsx
│   │       ├── BottomNav.jsx
│   │       ├── Avatar.jsx
│   │       └── Toast.jsx
│   │
│   ├── firebase/
│   │   ├── config.js
│   │   ├── auth.js
│   │   ├── firestore.js
│   │   ├── presence.js
│   │   └── storage.js
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useFeed.js
│   │   ├── usePresence.js
│   │   ├── useRooms.js
│   │   └── useMessages.js
│   │
│   ├── App.jsx
│   └── index.js
│
├── .env.example
├── .env.local
├── package.json
└── README.md
```

---

## 🎨 Design System

### Colors

```css
--gold:          #E8A020   /* Primary accent — Margdarshak */
--gold-light:    #FDF3E3   /* Gold backgrounds */
--teal:          #1D9E75   /* Secondary accent */
--teal-light:    #0D2E24   /* Teal backgrounds */
--purple:        #7C6EDA   /* Shishya accent */
--purple-light:  #1C1830   /* Purple backgrounds */
--red:           #E24B4A   /* Live indicator, urgent */
--bg:            #0D0D0F   /* App background */
--card:          #161618   /* Card background */
--card-2:        #1E1E22   /* Secondary card */
--border:        #2A2A2E   /* Borders */
--text-1:        #F0F0F0   /* Primary text */
--text-2:        #9A9A9A   /* Secondary text */
--text-muted:    #555558   /* Muted text */
```

### Typography
```
Font Family:  Inter (all weights)
Body:         14px, weight 400, line-height 1.65
Headings:     20–32px, weight 700–800
Captions:     11–12px, weight 500
Hindi/Devanagari script supported throughout
```

### Naming Conventions
```
Save post     →  Gyaan Bachao
Share post    →  Aage Bhejo
Join room     →  Shamil Hoon
Skip match    →  Aage Badhein
Connect       →  Dost Banao
View profile  →  Parichay Dekho
Sign in       →  Andar Aaiye
Sign up       →  Judiye
Sign out      →  Bahar Jaayein
Sessions      →  Baatcheet
Profile       →  Parichay
Feed          →  Gyan Ki Baat
Rooms         →  Chaupal
Match         →  Mera Dost
```

---

## 🔴 Real-Time Features

```
✅ Live online user counter
   Updates instantly as users join or leave

✅ Live community feed
   New posts appear without refresh

✅ Live Chaupal room presence
   See members join and leave in real time

✅ Real-time messaging
   Instant message delivery with typing indicators

✅ Live room member count
   Accurate count of who is listening

✅ Push notifications
   Messages, connections, live room alerts
```

---

## 📊 Data Models

### User
```javascript
{
  uid: string,
  name: string,
  email: string,
  role: "margdarshak" | "shishya",
  photoURL: string,
  city: string,
  bio: string,
  interests: string[],
  
  // Margdarshak only
  organization: string,
  designation: string,
  yearsOfService: number,
  availability: {
    days: string[],
    slots: string[],
    duration: number
  },
  verifiedAt: timestamp,
  gyaanScore: number,
  
  // Shishya only
  education: string,
  institution: string,
  careerGoal: string,
  
  profileComplete: boolean,
  createdAt: timestamp
}
```

### Post
```javascript
{
  uid: string,
  name: string,
  role: string,
  city: string,
  photoURL: string,
  content: string,
  type: "wisdom" | "question" | "story" | "win",
  interests: string[],
  likes: string[],
  comments: number,
  createdAt: timestamp
}
```

### Room
```javascript
{
  title: string,
  type: "voice" | "ama" | "study",
  topic: string,
  hostUid: string,
  hostName: string,
  status: "live" | "scheduled" | "ended",
  memberCount: number,
  scheduledAt: timestamp,
  createdAt: timestamp
}
```

### Conversation
```javascript
{
  participants: string[],
  participantNames: object,
  participantPhotos: object,
  participantRoles: object,
  lastMessage: string,
  lastMessageAt: timestamp,
  unreadCount: object
}
```

---

## 🗺 Roadmap

### Phase 1 — Foundation (Current)
```
✅ User authentication
✅ Profile creation
✅ Real-time community feed
✅ Live Chaupal rooms (presence)
✅ Mentor matching
✅ 1-on-1 messaging
□ Voice in Chaupal rooms (WebRTC)
□ Push notifications
□ Session booking system
```

### Phase 2 — Growth
```
□ AI-powered match scoring
□ Session recording and summaries
□ Gyaan Score algorithm
□ Wisdom library — searchable archive
□ College and institution partnerships
□ Elder verification system
□ Android and iOS native apps
```

### Phase 3 — Scale
```
□ Corporate CSR tie-ups with PSUs
□ Premium certification programs
□ Multi-language support
   (Tamil, Telugu, Bengali, Marathi)
□ Offline mode for low connectivity areas
□ Government partnership for elder onboarding
□ Impact measurement dashboard
```

---

## 💰 Business Model

```
PHASE 1 — FREE (Current)
Everything free for all users.
Focus: Growth, trust, community.

PHASE 2 — INSTITUTIONAL
College and university partnerships.
Corporate CSR sponsorships from PSUs
(BSNL, SBI, ISRO, Railways alumni).
Premium verified Margdarshak badges.

PHASE 3 — PREMIUM
Certification programs co-created 
with domain experts.
Priority matching for premium Shishyas.
Advanced analytics for institutions.
```

---

## 🤝 Contributing

```bash
# Fork the repository
# Create your feature branch
git checkout -b feature/your-feature-name

# Commit your changes
git commit -m "Add: your feature description"

# Push to branch
git push origin feature/your-feature-name

# Open a Pull Request
```

### Contribution Guidelines
```
✅ Follow existing naming conventions (Hinglish labels)
✅ Keep dark theme consistency — no white backgrounds
✅ All new user-facing text in Hindi or Hinglish
✅ Test on mobile viewport (390px width)
✅ Test real-time features on 2+ simultaneous devices
✅ No lorem ipsum — use realistic Indian names and cities
```

---

## 🧪 Testing the Demo

### Setup for Live Demo
```
Phone 1  →  Open as Margdarshak "Ramesh Verma"
Phone 2  →  Open as Shishya "Priya Sharma"
Phone 3  →  Judge scans QR code — joins live

Expected behavior:
- Counter increments with each new user
- Posts from Phone 1 appear on Phone 2 instantly
- All three appear in Chaupal room together
- Messages deliver in real time
```

### QR Code
```
Live URL: https://chhatrachhaya.netlify.app
Scan to try the app on your phone right now.
```

---

## 📜 License

```
MIT License

Copyright (c) 2025 Chhatrachhaya

Permission is hereby granted, free of charge, 
to any person obtaining a copy of this software 
to use, copy, modify, merge, publish, distribute, 
sublicense, and/or sell copies of the Software.
```

---

## 🙏 Acknowledgements

```
Built with love for the students of 
Gorakhpur, Varanasi, Allahabad, Lucknow, 
and every small city in India where 
ambition is enormous but guidance is scarce.

And for every retired professional 
who has a lifetime of wisdom 
and deserves a platform to share it.

Chhatrachhaya is for Bharat.
```

---

## 📬 Contact

```
Project:   Chhatrachhaya
Website:   https://chhatrachhaya.netlify.app
Email:     your@email.com
```

---

<div align="center">

**Chhatrachhaya — Buzurgon ki wisdom, naujawanon ka sapna**

*Wisdom ko distance khatam karne nahi deta.*

</div>
