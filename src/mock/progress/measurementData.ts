import type { MeasurementEntry, UserMeasurementHistory } from "../../types/progress";
import { MOCK_USERS } from "../users/data";
import { randomInt } from "../shared/utils";

function makeHistory(user: (typeof MOCK_USERS)[number]): UserMeasurementHistory {
  const months = 6;
  let weight = user.weightKg + randomInt(3, 10);
  let waist = user.waistCm + randomInt(2, 8);
  let chest = randomInt(85, 115);
  let hips = user.hipsCm + randomInt(1, 6);
  let bodyFat = user.bodyFatPct + randomInt(2, 8);

  const history: MeasurementEntry[] = [];
  for (let m = months; m >= 0; m--) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);

    weight = Math.max(user.weightKg, weight - randomInt(0, 2));
    waist = Math.max(user.waistCm, waist - randomInt(0, 1));
    chest = chest + randomInt(0, 1);
    hips = Math.max(user.hipsCm, hips - randomInt(0, 1));
    bodyFat = Math.max(user.bodyFatPct, bodyFat - randomInt(0, 1));

    history.push({
      date: d.toISOString(),
      weightKg: weight,
      waistCm: waist,
      chestCm: chest,
      hipsCm: hips,
      bodyFatPct: bodyFat,
    });
  }

  return {
    userId: user.id,
    ggfId: user.ggfId,
    userName: `${user.firstName} ${user.lastName}`,
    history,
  };
}

// 18 users tracked with a measurement timeline.
const TRACKED_USERS = MOCK_USERS.filter((_, i) => i % 6 === 0).slice(0, 18);

export const MOCK_MEASUREMENTS: UserMeasurementHistory[] = TRACKED_USERS.map(makeHistory);
