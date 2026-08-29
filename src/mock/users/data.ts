import type { AppUser, FitnessGoal } from "../../types/user";
import { CITIES, GOALS, fullName, ggfId } from "../shared/reference";
import { MOCK_COACHES } from "../coaches/data";
import { PLAN_NAMES } from "../shared/reference";
import { randomInt, daysAgo, pick } from "../shared/utils";

function makeUser(index: number): AppUser {
  const { name, gender } = fullName();
  const [firstName, lastName] = name.split(" ");
  const location = CITIES[index % CITIES.length];
  const heightCm = randomInt(150, 190);
  const weightKg = randomInt(50, 100);
  const hasCoach = index % 5 !== 0;
  const coach = hasCoach ? MOCK_COACHES[index % MOCK_COACHES.length] : null;
  const status = index % 13 === 0 ? "Inactive" : index % 19 === 0 ? "Pending" : "Active";
  const goal = pick(GOALS) as FitnessGoal;

  return {
    id: `user_${index}`,
    ggfId: ggfId(index),
    firstName,
    lastName,
    gender,
    userType: "User",
    dob: daysAgo(randomInt(7000, 18000)),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`,
    phone: `9${randomInt(100000000, 999999999)}`,
    city: location.city,
    state: location.state,
    country: "India",
    zipCode: String(randomInt(110001, 700099)),
    address: `${randomInt(1, 400)}, ${location.city} Layout`,

    heightCm,
    weightKg,
    waistCm: randomInt(65, 105),
    neckCm: randomInt(30, 44),
    hipsCm: randomInt(85, 115),
    bodyFatPct: randomInt(10, 32),
    bmr: Math.round(10 * weightKg + 6.25 * heightCm - 5 * 28 + (gender === "Male" ? 5 : -161)),
    tdee: Math.round((10 * weightKg + 6.25 * heightCm - 5 * 28 + (gender === "Male" ? 5 : -161)) * 1.4),

    goal,
    coachId: coach?.id ?? null,
    coachName: coach ? `${coach.firstName} ${coach.lastName}` : null,
    planName: hasCoach ? pick(PLAN_NAMES) : null,
    status,
    streakDays: randomInt(0, 210),

    joinedAt: daysAgo(randomInt(5, 700)),
    lastActiveAt: daysAgo(randomInt(0, 45)),
  };
}

export const MOCK_USERS: AppUser[] = Array.from({ length: 140 }, (_, i) => makeUser(i + 1));
