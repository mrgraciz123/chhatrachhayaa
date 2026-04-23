/**
 * Chhatrachhaya Email Service (Powered by EmailJS)
 * 
 * Note: To use this, you need an EmailJS account.
 * 1. Create a Service (e.g., Gmail)
 * 2. Create a Template with placeholders like {{user_name}} and {{message}}
 * 3. Replace the IDs below with your own.
 */

// Placeholder IDs - Replace these from your EmailJS dashboard
const SERVICE_ID = "service_he0mrts";
const TEMPLATE_ID = "template_y6ioav6";
const PUBLIC_KEY = "dmeL2Fl9bI5woANuo";

export async function sendWelcomeEmail(userName: string, userEmail: string, role: string, isNewUser: boolean = true) {
  if (SERVICE_ID.startsWith("YOUR_")) {
    console.warn("EmailJS IDs not configured yet. Skipping email.");
    return;
  }

  const welcomeMessage = isNewUser 
    ? (role === 'ELDER' 
        ? "Aapka tajurba aur wisdom kisi naujawan ki zindagi badal sakta hai. Is nek kaam mein hamara saath dene ke liye dhanyawad. Aapke Shishya aapka intezaar kar rahe hain."
        : "Aapne apne sapno ki taraf ek bada kadam badhaya hai. Hamare Margdarshak (Mentors) aapko guide karne ke liye taiyaar hain. Jaldi se apna pehla match dhoondhein!")
    : "Hume khushi hai ki aapne dobara Chhatrachhaya par kadam rakha. Aapki guidance ya seekhne ki yatra yahin se shuru hoti hai.";

  const subject = isNewUser 
    ? `Chhatrachhaya mein aapka swagat hai, ${userName}! 🪔`
    : `Chhatrachhaya mein aapka swagat hai, ${userName}! (Naya Login) 🪔`;

  const data = {
    service_id: SERVICE_ID,
    template_id: TEMPLATE_ID,
    user_id: PUBLIC_KEY,
    template_params: {
      user_name: userName,
      user_email: userEmail,
      message: welcomeMessage,
      subject: subject
    }
  };

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      console.log('Welcome email sent successfully!');
    } else {
      const errText = await response.text();
      console.error('Failed to send welcome email:', errText);
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}
