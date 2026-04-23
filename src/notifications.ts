import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type NotificationType = 'message' | 'dost' | 'like' | 'post' | 'room';

export const notifyIcons: Record<NotificationType, string> = {
  message: '📩',
  dost:    '🤝',
  like:    '💛',
  post:    '📢',
  room:    '🔴',
};

interface NotifyPayload {
  recipientUid: string;
  type: NotificationType;
  text: string;
  fromName: string;
  navigateTo?: string; // 'feed' | 'sessions' | 'rooms' | 'match'
}

export async function sendNotification(payload: NotifyPayload) {
  try {
    await addDoc(
      collection(db, 'users', payload.recipientUid, 'notifications'),
      {
        type:       payload.type,
        icon:       notifyIcons[payload.type],
        text:       payload.text,
        fromName:   payload.fromName,
        navigateTo: payload.navigateTo || 'feed',
        read:       false,
        createdAt:  serverTimestamp(),
      }
    );
  } catch (err) {
    // Silent fail — never block the main action for a notification
    console.warn('Notification write failed:', err);
  }
}
