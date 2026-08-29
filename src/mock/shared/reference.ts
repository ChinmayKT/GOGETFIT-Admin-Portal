export const FIRST_NAMES_M = [
  "Rahul", "Karthik", "Aditya", "Vikram", "Rohan", "Sanjay", "Arjun", "Nikhil", "Aman", "Siddharth",
  "Varun", "Aakash", "Manish", "Rajesh", "Gaurav", "Suresh", "Deepak", "Ankit", "Harsh", "Vivek",
];
export const FIRST_NAMES_F = [
  "Priya", "Sneha", "Anjali", "Kavya", "Neha", "Pooja", "Divya", "Ritu", "Shreya", "Meera",
  "Ananya", "Nisha", "Kritika", "Swati", "Ishita", "Radhika", "Simran", "Tanya", "Aarti", "Komal",
];
export const LAST_NAMES = [
  "Sharma", "Verma", "Iyer", "Nair", "Rao", "Gupta", "Reddy", "Menon", "Singh", "Patel",
  "Kulkarni", "Joshi", "Kapoor", "Malhotra", "Chopra", "Bhat", "Pillai", "Desai", "Agarwal", "Bose",
];

export const CITIES: { city: string; state: string }[] = [
  { city: "Bengaluru", state: "Karnataka" },
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Delhi", state: "Delhi" },
  { city: "Gurugram", state: "Haryana" },
  { city: "Kochi", state: "Kerala" },
  { city: "Ahmedabad", state: "Gujarat" },
  { city: "Jaipur", state: "Rajasthan" },
];

export const GOALS = ["Fat Loss", "Muscle Gain", "Body Recomposition", "General Fitness", "Strength", "Endurance"];

export const SPECIALIZATIONS = [
  "Weight Loss Coaching", "Strength & Conditioning", "Sports Nutrition", "Postnatal Fitness",
  "Bodybuilding Prep", "Functional Training", "Yoga & Mobility", "Calisthenics",
];

export const LANGUAGES = ["English", "Hindi", "Kannada", "Tamil", "Telugu", "Malayalam", "Marathi", "Bengali"];

export function fullName(): { name: string; gender: "Male" | "Female" } {
  const gender: "Male" | "Female" = Math.random() > 0.5 ? "Male" : "Female";
  const first = gender === "Male" ? FIRST_NAMES_M[Math.floor(Math.random() * FIRST_NAMES_M.length)] : FIRST_NAMES_F[Math.floor(Math.random() * FIRST_NAMES_F.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return { name: `${first} ${last}`, gender };
}

export function ggfId(index: number): string {
  return `GGF${(10000 + index).toString()}`;
}

export const PLAN_NAMES = [
  "Fat Loss — Starter", "Fat Loss — Advanced", "Muscle Gain — Beginner", "Muscle Gain — Intermediate",
  "Body Recomposition — 12 Week", "General Fitness — Foundation", "Strength — Powerbuilding",
  "Endurance — Runner's Base", "Transformation Challenge — 90 Day",
];

