export const QUIZ_DATA: Record<string, { q: string, a: string, options: string[] }[]> = {
  "UPSC": [
    { q: "UPSC Civil Services exam mein kitne stages hote hain?", a: "3", options: ["2", "3", "4", "5"] },
    { q: "UPSC ke liye minimum umar (age) kya hai?", a: "21", options: ["18", "21", "25", "28"] }
  ],
  "Banking": [
    { q: "Bharat ka Central Bank kaunsa hai?", a: "RBI", options: ["SBI", "RBI", "HDFC", "PNB"] },
    { q: "Fixed Deposit (FD) par milne wala interest kya hota hai?", a: "Fixed", options: ["Variable", "Fixed", "Market-Linked", "Zero"] }
  ],
  "Technology": [
    { q: "Website banane ke liye primary language kaunsi hai?", a: "HTML", options: ["Java", "Python", "HTML", "C++"] },
    { q: "CPU ka full form kya hai?", a: "Central Processing Unit", options: ["Control Processing Unit", "Central Processing Unit", "Core Power Unit", "Computer Processing Unit"] }
  ],
  "Business": [
    { q: "IPO ka matlab kya hota hai?", a: "Initial Public Offering", options: ["Internal Profit Order", "Initial Public Offering", "Investment Post Office", "Income Profit Option"] },
    { q: "Shark Tank mein 'Equity' ka kya matlab hai?", a: "Ownership", options: ["Loan", "Debt", "Ownership", "Salary"] }
  ],
  "Agriculture": [
    { q: "Kharif fasal (crop) kab boi jaati hai?", a: "Monsoon", options: ["Winter", "Summer", "Monsoon", "Autumn"] },
    { q: "Mitti ki fertility badhane ke liye kya use hota hai?", a: "Fertilizers", options: ["Salt", "Fertilizers", "Plastic", "Fuel"] }
  ],
  "General": [
    { q: "Bharat ka rashtriya phool (national flower) kaunsa hai?", a: "Lotus", options: ["Rose", "Lotus", "Sunflower", "Lily"] },
    { q: "Suraj kis disha (direction) se nikalta hai?", a: "East", options: ["West", "North", "South", "East"] }
  ]
};
