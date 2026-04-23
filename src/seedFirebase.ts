import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function seedDatabase() {
  try {
    const posts = [
      { author_name: 'Rajesh Kumar', author_role: 'ELDER', city: 'Lucknow', content: 'Beta, UPSC ki taiyari ke liye sabse pehle NCERT padho. 10 saal ki government service mein maine dekha hai ki jo log basics strong karte hain, woh aage jaate hain. Consistency hi success hai. 🙏', tags: ['govt jobs', 'career'], likes: 47, replies: 12 },
      { author_name: 'Priya Sharma', author_role: 'STUDENT', city: 'Varanasi', content: 'Koi mujhe bata sakta hai ki data science ke liye konsa course se start karein? BCA 2nd year mein hoon, coding thodi aati hai. Family ka pressure hai government job ka but mujhe tech mein interest hai. 😅', tags: ['tech', 'advice'], likes: 18, replies: 8 },
      { author_name: 'Amit Singh', author_role: 'STUDENT', city: 'Agra', content: 'Finally! CAT mein 85 percentile aayi! Sab logo ne kaha tha small town se MBA nahi hoti. Aaj unhe jawab de diya. Chhatrachhaya ke mentor uncle ne jo guidance di, usne sab badal diya! 🎉', tags: ['success story', 'mba'], likes: 234, replies: 45 },
      { author_name: 'Dr. Mohan Lal', author_role: 'ELDER', city: 'Allahabad', content: 'ISRO mein 28 saal kaam kiya. Aerospace engineering mein career banana mushkil lagta hai lekin impossible nahi. JEE ke baad NIT ya IIT se B.Tech karo. Dedication chahiye — seedha poochho mujhse! 🚀', tags: ['isro', 'engineering'], likes: 156, replies: 31 },
    ];

    console.log('Seeding posts...');
    for (const post of posts) {
      await addDoc(collection(db, 'posts'), {
        ...post,
        createdAt: serverTimestamp(),
      });
    }

    console.log('Database seeding complete!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
}
