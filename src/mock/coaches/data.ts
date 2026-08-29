import type { Coach, CoachLevel } from "../../types/coach";
import { CITIES, LANGUAGES, SPECIALIZATIONS, fullName } from "../shared/reference";
import { pickMany, randomInt, daysAgo } from "../shared/utils";
import { svgImagePlaceholder } from "../content/placeholder";

function makeCoach(index: number): Coach {
  const { name, gender } = fullName();
  const [firstName, lastName] = name.split(" ");
  const location = CITIES[index % CITIES.length];
  const level = (randomInt(1, 5) as CoachLevel);
  const activeClients = randomInt(4, 38);
  const status = index % 11 === 0 ? "Pending Approval" : index % 17 === 0 ? "Inactive" : "Active";

  return {
    id: `coach_${index}`,
    firstName,
    lastName,
    gender,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@gogetfit.in`,
    phone: `9${randomInt(100000000, 999999999)}`,
    languages: pickMany(LANGUAGES, randomInt(1, 3)),
    city: location.city,
    state: location.state,
    country: "India",
    profilePicture: null,
    coverPhoto: svgImagePlaceholder(index, `${firstName} ${lastName}`),
    level,
    specialization: SPECIALIZATIONS[index % SPECIALIZATIONS.length],
    description: `${SPECIALIZATIONS[index % SPECIALIZATIONS.length]} specialist with a client-first coaching style, focused on sustainable results.`,
    transformationsCount: randomInt(2, 45),
    availableSlots: Math.max(0, 40 - activeClients),
    activeClients,
    pendingClients: randomInt(0, 5),
    status,
    facebook: index % 3 === 0 ? "https://facebook.com/coach" : null,
    instagram: index % 2 === 0 ? "https://instagram.com/coach" : null,
    linkedin: null,
    certificates:
      index % 4 === 0
        ? [{ id: `cert_${index}_1`, fileName: "certification.pdf", uploadedAt: daysAgo(randomInt(10, 400)) }]
        : [],
    joinedAt: daysAgo(randomInt(30, 900)),
  };
}

export const MOCK_COACHES: Coach[] = Array.from({ length: 26 }, (_, i) => makeCoach(i + 1));
