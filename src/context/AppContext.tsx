import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type UserRole = 'ELDER' | 'STUDENT';

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  city: string;
  avatar: string; // initials
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  timestamp: number;
}

export interface Room {
  id: string;
  title: string;
  topic: string;
  hostName: string;
  hostRole: UserRole;
  participantCount: number;
  isLive: boolean;
  createdAt: number;
}

interface AppCtx {
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
  rooms: Room[];
  addRoom: (r: Room) => void;
  messages: Record<string, Message[]>;
  sendMessage: (roomId: string, text: string) => void;
  onlineUsers: AppUser[];
}

const Ctx = createContext<AppCtx | null>(null);

// Shared state via BroadcastChannel + localStorage for multi-tab real-time
const BC_KEY = 'chhatrachhaya_bc';
const STORAGE_KEYS = { rooms: 'fd_rooms', messages: 'fd_messages', users: 'fd_users' };

const SEED_ROOMS: Room[] = [
  { id: 'r1', title: 'UPSC Strategy 2025', topic: 'Sarkari Naukri', hostName: 'Rajesh Kumar', hostRole: 'ELDER', participantCount: 3, isLive: true, createdAt: Date.now() - 3600000 },
  { id: 'r2', title: 'Tech Career Mein Kaise Jaayein?', topic: 'Technology', hostName: 'Dr. Mohan Lal', hostRole: 'ELDER', participantCount: 5, isLive: true, createdAt: Date.now() - 1800000 },
  { id: 'r3', title: 'Banking Jobs — Insider Tips', topic: 'Banking', hostName: 'Sunita Verma', hostRole: 'ELDER', participantCount: 2, isLive: false, createdAt: Date.now() + 7200000 },
];

const SEED_MESSAGES: Record<string, Message[]> = {
  r1: [
    { id: 'm1', roomId: 'r1', userId: 'e1', userName: 'Rajesh Kumar', userRole: 'ELDER', text: 'Namaste sabko! Aaj hum UPSC 2025 ki strategy ke baare mein baat karenge.', timestamp: Date.now() - 3500000 },
    { id: 'm2', roomId: 'r1', userId: 's1', userName: 'Priya Sharma', userRole: 'STUDENT', text: 'Namaste sir! Main BCA 2nd year se hoon, kya aap prelims ke liye best books bata sakte hain?', timestamp: Date.now() - 3400000 },
    { id: 'm3', roomId: 'r1', userId: 'e1', userName: 'Rajesh Kumar', userRole: 'ELDER', text: 'Bilkul! NCERT se start karo — class 6 se 12 tak. Yeh fundamentals ke liye sabse important hai. Phir Laxmikant polity ke liye.', timestamp: Date.now() - 3300000 },
  ],
  r2: [
    { id: 'm4', roomId: 'r2', userId: 'e2', userName: 'Dr. Mohan Lal', userRole: 'ELDER', text: 'ISRO mein 28 saal kaam karne ke baad main keh sakta hoon — engineering mein passion sabse zaroori hai.', timestamp: Date.now() - 1700000 },
    { id: 'm5', roomId: 'r2', userId: 's2', userName: 'Amit Singh', userRole: 'STUDENT', text: 'Sir aapne JEE kaisi crack ki thi? Mere liye tips share karein please!', timestamp: Date.now() - 1600000 },
  ],
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function saveToStorage(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUser | null>(() => loadFromStorage('fd_user', null));
  const [rooms, setRooms] = useState<Room[]>(() => loadFromStorage(STORAGE_KEYS.rooms, SEED_ROOMS));
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => loadFromStorage(STORAGE_KEYS.messages, SEED_MESSAGES));
  const [onlineUsers, setOnlineUsers] = useState<AppUser[]>([]);
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const bc = new BroadcastChannel(BC_KEY);
    bcRef.current = bc;
    bc.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'MESSAGE') {
        setMessages(prev => {
          const updated = { ...prev, [payload.roomId]: [...(prev[payload.roomId] ?? []), payload] };
          saveToStorage(STORAGE_KEYS.messages, updated);
          return updated;
        });
      }
      if (type === 'ROOM') {
        setRooms(prev => { const updated = [payload, ...prev]; saveToStorage(STORAGE_KEYS.rooms, updated); return updated; });
      }
      if (type === 'ONLINE') {
        setOnlineUsers(payload);
      }
    };
    return () => bc.close();
  }, []);

  const setUser = (u: AppUser | null) => {
    setUserState(u);
    saveToStorage('fd_user', u);
  };

  const sendMessage = (roomId: string, text: string) => {
    if (!user || !text.trim()) return;
    const msg: Message = {
      id: `m_${Date.now()}_${Math.random()}`,
      roomId, userId: user.id, userName: user.name, userRole: user.role,
      text: text.trim(), timestamp: Date.now(),
    };
    setMessages(prev => {
      const updated = { ...prev, [roomId]: [...(prev[roomId] ?? []), msg] };
      saveToStorage(STORAGE_KEYS.messages, updated);
      return updated;
    });
    bcRef.current?.postMessage({ type: 'MESSAGE', payload: msg });
  };

  const addRoom = (r: Room) => {
    setRooms(prev => { const updated = [r, ...prev]; saveToStorage(STORAGE_KEYS.rooms, updated); return updated; });
    bcRef.current?.postMessage({ type: 'ROOM', payload: r });
  };

  return <Ctx.Provider value={{ user, setUser, rooms, addRoom, messages, sendMessage, onlineUsers }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('Must be inside AppProvider');
  return ctx;
}
