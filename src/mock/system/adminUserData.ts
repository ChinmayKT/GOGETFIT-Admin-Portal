import type { AdminUser } from "../../types/permissions";
import { fullName } from "../shared/reference";
import { daysAgo, randomInt } from "../shared/utils";
import { ROLES } from "./roles";

// A representative spread across most of the 9 system roles, not a strict round-robin,
// so the list reads like a real org rather than a generated pattern.
const ROLE_SEQUENCE = [
  "role_super_admin",
  "role_operations_admin",
  "role_coach_manager",
  "role_coach_manager",
  "role_nutrition_manager",
  "role_fitness_manager",
  "role_fitness_manager",
  "role_content_manager",
  "role_commerce_manager",
  "role_support",
  "role_support",
  "role_analyst",
  "role_operations_admin",
  "role_content_manager",
];

function makeAdminUser(index: number): AdminUser {
  const { name } = fullName();
  const [first, last] = name.split(" ");
  const roleId = ROLE_SEQUENCE[index % ROLE_SEQUENCE.length] ?? ROLES[0].id;
  const status: AdminUser["status"] = index % 9 === 0 ? "Inactive" : "Active";

  return {
    id: `admin_${index + 1}`,
    name,
    email: `${first.toLowerCase()}.${last.toLowerCase()}${index + 1}@gogetfit.in`,
    roleId,
    status,
    lastActive: daysAgo(status === "Inactive" ? randomInt(30, 120) : randomInt(0, 6)),
    createdAt: daysAgo(randomInt(60, 700)),
    avatarSeed: name,
  };
}

export const MOCK_ADMIN_USERS: AdminUser[] = Array.from({ length: 14 }, (_, i) => makeAdminUser(i));
